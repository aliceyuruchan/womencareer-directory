import { loadConfig, search, type SearchOptions } from "./ai-search-client";

// 稳定性测试：同一查询连续请求多次，观察结果集是否一致、两路召回数量与耗时的波动。
// 用法：npx tsx scripts/search-stability.ts --query 实习 --repeat 20 [--type hybrid|vector|keyword] [--rerank 0.1|off] [--match 0.3]

const args = process.argv.slice(2);
const option = (name: string) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const query = option("--query");
const repeat = Number(option("--repeat") ?? 20);
if (!query) throw new Error("缺少 --query");

const rerankOption = option("--rerank") ?? "0.1";
const searchOptions: SearchOptions = {
  retrievalType: (option("--type") as SearchOptions["retrievalType"]) ?? "hybrid",
  rerank: rerankOption === "off" ? false : { threshold: Number(rerankOption) },
  matchThreshold: option("--match") !== undefined ? Number(option("--match")) : undefined,
};

const config = loadConfig();

async function main() {
  const signatures = new Map<string, number>();
  const durations: number[] = [];
  for (let round = 1; round <= repeat; round += 1) {
    const result = await search(config, query!, searchOptions);
    const signature = result.hits.map((hit) => hit.id).join(",");
    signatures.set(signature, (signatures.get(signature) ?? 0) + 1);
    durations.push(result.durationMs);
    console.log(
      `#${String(round).padStart(2)} ${result.hits.length} 条 关键词${result.keywordCount ?? "-"} 向量${result.vectorCount ?? "-"} ${result.durationMs}ms ${result.hits.slice(0, 5).map((hit) => `${hit.id}:${hit.score.toFixed(2)}`).join(" ")}`,
    );
  }
  durations.sort((a, b) => a - b);
  console.log(`\n不同结果集 ${signatures.size} 种；耗时 p50=${durations[Math.floor(durations.length / 2)]}ms p90=${durations[Math.floor(durations.length * 0.9)]}ms max=${durations.at(-1)}ms`);
  for (const [signature, count] of signatures) console.log(`  ${count} 次：${signature || "(空)"}`);
}

main();
