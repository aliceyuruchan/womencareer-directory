import fs from "node:fs";
import path from "node:path";
import { getFilteredResources, mergeSearchResults } from "@/lib/resource-search";
import { loadConfig, search, type SearchHit, type SearchOptions } from "./ai-search-client";

// 离线评测：对比字面匹配、AI Search 各参数、以及两者合并策略。
// 用法：npx tsx scripts/search-eval.ts [--variants hybrid,vector] [--refresh] [--detail] [--top 10] [--tag st04] [--judgments <file>]
// AI Search 的原始返回缓存在 search-eval/results/<tag>/<variant>.json，--refresh 重新请求。
// --tag 用来区分实例级配置（例如 score_threshold）不同时的结果。
// 标注：默认用 search-eval/queries.json 的 relevant（Claude 通读全部资源后编写，二元，列出的按 2 处理）；
// --judgments 指定三档标注文件（规则见 search-eval/labeling-guide.md），格式 { "judgments": { 查询: { 资源 id: 1 或 2 } } }，没有列出的按 0 处理。
// 指标：R@k、MRR 只把 2 算作相关；R1@k 把 1 和 2 都算作相关；P@k 是前 k 条里 1 和 2 的比例；noise 是前 k 条里 0 的条数；
// nDCG@k 的增益为 2^等级 - 1。某个查询没有标 2（或 1）的资源时，这个查询不参与对应召回指标的平均。

interface EvalQuery {
  query: string;
  lang: "zh" | "en";
  relevant: string[];
}

type Grades = Map<string, number>;

interface Metrics {
  recall: number | null;
  recallUseful: number | null;
  precision: number;
  mrr: number | null;
  ndcg: number | null;
  zero: number;
  noise: number;
  length: number;
}

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const option = (name: string) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const TOP_K = Number(option("--top") ?? 10);
const RESULTS_DIR = path.join(process.cwd(), "search-eval", "results", option("--tag") ?? "default");
const queries: EvalQuery[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), "search-eval", "queries.json"), "utf8"));

function loadGrades(): Map<string, Grades> {
  const judgmentsFile = option("--judgments");
  if (!judgmentsFile) {
    return new Map(queries.map((item) => [item.query, new Map(item.relevant.map((id) => [id, 2]))]));
  }
  const parsed = JSON.parse(fs.readFileSync(path.resolve(judgmentsFile), "utf8")) as { judgments: Record<string, Record<string, number>> };
  const result = new Map<string, Grades>();
  for (const item of queries) {
    const judged = parsed.judgments[item.query];
    if (!judged) throw new Error(`${judgmentsFile} 里没有查询 ${item.query}`);
    for (const [id, grade] of Object.entries(judged)) {
      if (grade !== 1 && grade !== 2) throw new Error(`${judgmentsFile} 里 ${item.query} / ${id} 的等级是 ${grade}，只能列出 1 或 2`);
    }
    result.set(item.query, new Map(Object.entries(judged)));
  }
  return result;
}

const gradesByQuery = loadGrades();
const gradesOf = (item: EvalQuery) => gradesByQuery.get(item.query)!;

const AI_VARIANTS: Record<string, SearchOptions> = {
  hybrid: { retrievalType: "hybrid" },
  "hybrid-rr01": { retrievalType: "hybrid", rerank: { threshold: 0.1 } },
  "hybrid-rr03": { retrievalType: "hybrid", rerank: { threshold: 0.3 } },
  "hybrid-rewrite": { retrievalType: "hybrid", rewrite: true },
  vector: { retrievalType: "vector" },
  keyword: { retrievalType: "keyword" },
};

const selectedVariants = (option("--variants") ?? Object.keys(AI_VARIANTS).join(","))
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean);

for (const name of selectedVariants) {
  if (!AI_VARIANTS[name]) throw new Error(`未知的 variant: ${name}`);
}

const config = loadConfig();
fs.mkdirSync(RESULTS_DIR, { recursive: true });

async function loadVariantHits(name: string): Promise<Record<string, SearchHit[]>> {
  const file = path.join(RESULTS_DIR, `${name}.json`);
  if (!flag("--refresh") && fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  }
  const hits: Record<string, SearchHit[]> = {};
  const durations: number[] = [];
  for (const item of queries) {
    const result = await search(config, item.query, AI_VARIANTS[name]);
    hits[item.query] = result.hits;
    durations.push(result.durationMs);
  }
  durations.sort((a, b) => a - b);
  console.log(`${name}: 请求 ${queries.length} 次，耗时 p50=${durations[Math.floor(durations.length / 2)]}ms p90=${durations[Math.floor(durations.length * 0.9)]}ms`);
  fs.writeFileSync(file, JSON.stringify(hits, null, 2), "utf8");
  return hits;
}

const gain = (grade: number) => 2 ** grade - 1;

function evaluate(ranked: string[], grades: Grades): Metrics {
  const top = ranked.slice(0, TOP_K);
  const gradeOf = (id: string) => grades.get(id) ?? 0;
  const fullCount = [...grades.values()].filter((grade) => grade === 2).length;
  const usefulCount = [...grades.values()].filter((grade) => grade >= 1).length;
  const fullHits = top.filter((id) => gradeOf(id) === 2).length;
  const usefulHits = top.filter((id) => gradeOf(id) >= 1).length;
  const firstIndex = ranked.findIndex((id) => gradeOf(id) === 2);
  const dcg = top.reduce((sum, id, index) => sum + gain(gradeOf(id)) / Math.log2(index + 2), 0);
  const ideal = [...grades.values()]
    .sort((a, b) => b - a)
    .slice(0, TOP_K)
    .reduce((sum, grade, index) => sum + gain(grade) / Math.log2(index + 2), 0);
  return {
    recall: fullCount > 0 ? fullHits / Math.min(fullCount, TOP_K) : null,
    recallUseful: usefulCount > 0 ? usefulHits / Math.min(usefulCount, TOP_K) : null,
    precision: top.length > 0 ? usefulHits / top.length : 0,
    mrr: fullCount > 0 ? (firstIndex >= 0 ? 1 / (firstIndex + 1) : 0) : null,
    ndcg: ideal > 0 ? dcg / ideal : null,
    zero: ranked.length === 0 ? 1 : 0,
    noise: top.length - usefulHits,
    length: ranked.length,
  };
}

// 召回类指标为 null 的查询（没有对应等级的标注）不参与该指标的平均
function mean(values: (number | null)[]): number {
  const present = values.filter((value): value is number => value !== null);
  return present.length > 0 ? present.reduce((sum, value) => sum + value, 0) / present.length : Number.NaN;
}

function average(list: Metrics[]): Metrics {
  return {
    recall: mean(list.map((item) => item.recall)),
    recallUseful: mean(list.map((item) => item.recallUseful)),
    precision: mean(list.map((item) => item.precision)),
    mrr: mean(list.map((item) => item.mrr)),
    ndcg: mean(list.map((item) => item.ndcg)),
    zero: list.reduce((sum, item) => sum + item.zero, 0),
    noise: mean(list.map((item) => item.noise)),
    length: mean(list.map((item) => item.length)),
  };
}

// 语义命中低于绝对分数 minScore 的丢弃（用于观察绝对门槛是否可用）
function aboveScore(hits: SearchHit[], minScore: number): SearchHit[] {
  return hits.filter((hit) => hit.score >= minScore);
}

function rrfFusion(lists: string[][], k = 60): string[] {
  const scores = new Map<string, number>();
  for (const list of lists) {
    list.forEach((id, index) => scores.set(id, (scores.get(id) ?? 0) + 1 / (k + index + 1)));
  }
  return [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}

type System = { name: string; rank: (item: EvalQuery) => string[] };

async function main() {
  const variantHits: Record<string, Record<string, SearchHit[]>> = {};
  for (const name of selectedVariants) variantHits[name] = await loadVariantHits(name);

  const systems: System[] = [{ name: "local", rank: (item) => getFilteredResources(item.query).map((r) => r.id) }];

  for (const name of selectedVariants) {
    const hitsOf = (item: EvalQuery) => variantHits[name][item.query] ?? [];
    systems.push({ name: `ai:${name}`, rank: (item) => hitsOf(item).map((hit) => hit.id) });
    systems.push({
      name: `final:${name}`,
      rank: (item) => mergeSearchResults(getFilteredResources(item.query), hitsOf(item)).map((r) => r.id),
    });
    for (const minScore of [0.45, 0.6]) {
      systems.push({
        name: `union:${name}@${minScore}`,
        rank: (item) =>
          mergeSearchResults(getFilteredResources(item.query), aboveScore(hitsOf(item), minScore), { minScore: 0, relativeThreshold: 0, maxExtra: 50 }).map((r) => r.id),
      });
    }
    for (const relativeThreshold of [0, 0.85, 0.9]) {
      for (const maxExtra of [5, 8, 12, 50]) {
        systems.push({
          name: `union:${name}@rel${relativeThreshold}top${maxExtra}`,
          rank: (item) => mergeSearchResults(getFilteredResources(item.query), hitsOf(item), { minScore: 0, relativeThreshold, maxExtra }).map((r) => r.id),
        });
      }
    }
    for (const minScore of [0.42, 0.45, 0.47, 0.5]) {
      systems.push({
        name: `union:${name}@floor${minScore}rel0.85top12`,
        rank: (item) => mergeSearchResults(getFilteredResources(item.query), hitsOf(item), { minScore, relativeThreshold: 0.85, maxExtra: 12 }).map((r) => r.id),
      });
    }
    systems.push({
      name: `rrf:${name}`,
      rank: (item) => rrfFusion([getFilteredResources(item.query).map((r) => r.id), hitsOf(item).map((hit) => hit.id)]),
    });
    for (const cap of [8, 12]) {
      systems.push({
        name: `rrf:${name}@top${cap}`,
        rank: (item) => rrfFusion([getFilteredResources(item.query).map((r) => r.id), hitsOf(item).map((hit) => hit.id)]).slice(0, cap),
      });
    }
  }

  const byLang = { zh: queries.filter((q) => q.lang === "zh"), en: queries.filter((q) => q.lang === "en") };
  const withoutFull = queries.filter((item) => ![...gradesOf(item).values()].includes(2)).length;
  console.log(`\n查询 ${queries.length} 条（zh ${byLang.zh.length} / en ${byLang.en.length}），Top-${TOP_K}；没有标 2 的查询 ${withoutFull} 条`);
  console.log("system".padEnd(28), "R@k".padStart(6), "R1@k".padStart(6), "P@k".padStart(6), "MRR".padStart(6), "nDCG".padStart(6), "zero".padStart(5), "noise".padStart(6), "len".padStart(6), "| zh R@k".padStart(9), "en R@k".padStart(7));

  const format = (value: number | null) => (value === null ? "-" : value.toFixed(2));
  for (const system of systems) {
    const perQuery = queries.map((item) => ({ item, metrics: evaluate(system.rank(item), gradesOf(item)) }));
    const all = average(perQuery.map((entry) => entry.metrics));
    const zh = average(perQuery.filter((entry) => entry.item.lang === "zh").map((entry) => entry.metrics));
    const en = average(perQuery.filter((entry) => entry.item.lang === "en").map((entry) => entry.metrics));
    console.log(
      system.name.padEnd(28),
      all.recall!.toFixed(3).padStart(6),
      all.recallUseful!.toFixed(3).padStart(6),
      all.precision.toFixed(3).padStart(6),
      all.mrr!.toFixed(3).padStart(6),
      all.ndcg!.toFixed(3).padStart(6),
      String(all.zero).padStart(5),
      all.noise.toFixed(2).padStart(6),
      all.length.toFixed(1).padStart(6),
      "|",
      zh.recall!.toFixed(3).padStart(7),
      en.recall!.toFixed(3).padStart(7),
    );

    // 明细：标 2 的资源直接写 id，标 1 的写 id*，标 0 的写 (id)
    if (flag("--detail") && (option("--detail-system") ?? system.name) === system.name) {
      for (const entry of perQuery) {
        const grades = gradesOf(entry.item);
        const ranked = system.rank(entry.item).slice(0, TOP_K);
        const marks = ranked.map((id) => (grades.get(id) === 2 ? id : grades.get(id) === 1 ? `${id}*` : `(${id})`)).join(" ");
        console.log(`  ${entry.item.query.padEnd(20)} R=${format(entry.metrics.recall)} MRR=${format(entry.metrics.mrr)} ${marks}`);
      }
    }
  }
}

main();
