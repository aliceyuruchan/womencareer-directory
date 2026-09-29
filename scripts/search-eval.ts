import fs from "node:fs";
import path from "node:path";
import { getFilteredResources, mergeSearchResults } from "@/lib/resource-search";
import { loadConfig, search, type SearchHit, type SearchOptions } from "./ai-search-client";

// 离线评测：用 search-eval/queries.json 里的人工标注，对比字面匹配、AI Search 各参数、以及两者合并策略。
// 用法：npx tsx scripts/search-eval.ts [--variants hybrid,vector] [--refresh] [--detail] [--top 10] [--tag st04]
// AI Search 的原始返回缓存在 search-eval/results/<tag>/<variant>.json，--refresh 重新请求。
// --tag 用来区分实例级配置（例如 score_threshold）不同时的结果。

interface EvalQuery {
  query: string;
  lang: "zh" | "en";
  relevant: string[];
}

interface Metrics {
  recall: number;
  precision: number;
  mrr: number;
  ndcg: number;
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

function evaluate(ranked: string[], relevant: string[]): Metrics {
  const top = ranked.slice(0, TOP_K);
  const relevantSet = new Set(relevant);
  const hitCount = top.filter((id) => relevantSet.has(id)).length;
  const firstIndex = ranked.findIndex((id) => relevantSet.has(id));
  let dcg = 0;
  top.forEach((id, index) => {
    if (relevantSet.has(id)) dcg += 1 / Math.log2(index + 2);
  });
  let ideal = 0;
  for (let index = 0; index < Math.min(relevant.length, TOP_K); index += 1) ideal += 1 / Math.log2(index + 2);
  return {
    recall: hitCount / Math.min(relevant.length, TOP_K),
    precision: top.length > 0 ? hitCount / top.length : 0,
    mrr: firstIndex >= 0 ? 1 / (firstIndex + 1) : 0,
    ndcg: ideal > 0 ? dcg / ideal : 0,
    zero: ranked.length === 0 ? 1 : 0,
    noise: top.length - hitCount,
    length: ranked.length,
  };
}

function average(list: Metrics[]): Metrics {
  const sum = list.reduce(
    (acc, item) => ({
      recall: acc.recall + item.recall,
      precision: acc.precision + item.precision,
      mrr: acc.mrr + item.mrr,
      ndcg: acc.ndcg + item.ndcg,
      zero: acc.zero + item.zero,
      noise: acc.noise + item.noise,
      length: acc.length + item.length,
    }),
    { recall: 0, precision: 0, mrr: 0, ndcg: 0, zero: 0, noise: 0, length: 0 },
  );
  const n = list.length;
  return {
    recall: sum.recall / n,
    precision: sum.precision / n,
    mrr: sum.mrr / n,
    ndcg: sum.ndcg / n,
    zero: sum.zero,
    noise: sum.noise / n,
    length: sum.length / n,
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
  console.log(`\n查询 ${queries.length} 条（zh ${byLang.zh.length} / en ${byLang.en.length}），Top-${TOP_K}`);
  console.log("system".padEnd(28), "R@k".padStart(6), "P@k".padStart(6), "MRR".padStart(6), "nDCG".padStart(6), "zero".padStart(5), "noise".padStart(6), "len".padStart(6), "| zh R@k".padStart(9), "en R@k".padStart(7));

  for (const system of systems) {
    const perQuery = queries.map((item) => ({ item, metrics: evaluate(system.rank(item), item.relevant) }));
    const all = average(perQuery.map((entry) => entry.metrics));
    const zh = average(perQuery.filter((entry) => entry.item.lang === "zh").map((entry) => entry.metrics));
    const en = average(perQuery.filter((entry) => entry.item.lang === "en").map((entry) => entry.metrics));
    console.log(
      system.name.padEnd(28),
      all.recall.toFixed(3).padStart(6),
      all.precision.toFixed(3).padStart(6),
      all.mrr.toFixed(3).padStart(6),
      all.ndcg.toFixed(3).padStart(6),
      String(all.zero).padStart(5),
      all.noise.toFixed(2).padStart(6),
      all.length.toFixed(1).padStart(6),
      "|",
      zh.recall.toFixed(3).padStart(7),
      en.recall.toFixed(3).padStart(7),
    );

    if (flag("--detail") && (option("--detail-system") ?? system.name) === system.name) {
      for (const entry of perQuery) {
        const ranked = system.rank(entry.item).slice(0, TOP_K);
        const marks = ranked.map((id) => (entry.item.relevant.includes(id) ? id : `(${id})`)).join(" ");
        console.log(`  ${entry.item.query.padEnd(20)} R=${entry.metrics.recall.toFixed(2)} MRR=${entry.metrics.mrr.toFixed(2)} ${marks}`);
      }
    }
  }
}

main();
