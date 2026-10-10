import { getInstance, instanceRequest, listItems, loadConfig, updateInstance } from "./ai-search-client";

// 查看或修改 AI Search 实例配置、查看索引条目状态。
// 用法：
//   npx tsx scripts/ai-search-instance.ts show
//   npx tsx scripts/ai-search-instance.ts items
//   npx tsx scripts/ai-search-instance.ts item resources/001.md
//   npx tsx scripts/ai-search-instance.ts reindex [queued|running|error]
//   npx tsx scripts/ai-search-instance.ts set score_threshold=0.2 max_num_results=50

const [command, ...rest] = process.argv.slice(2);
const config = loadConfig();

const SHOWN_FIELDS = [
  "id",
  "embedding_model",
  "hybrid_search_enabled",
  "fusion_method",
  "reranking",
  "reranking_model",
  "rewrite_query",
  "cache",
  "cache_threshold",
  "score_threshold",
  "max_num_results",
  "chunk_size",
  "chunk_overlap",
  "indexing_options",
  "retrieval_options",
  "custom_metadata",
  "status",
  "modified_at",
];

function parseValue(raw: string): unknown {
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  return raw;
}

async function main() {
  if (command === "show") {
    const instance = await getInstance(config);
    for (const field of SHOWN_FIELDS) console.log(`${field}: ${JSON.stringify(instance[field])}`);
    return;
  }

  if (command === "items") {
    const items = await listItems(config);
    const counts = new Map<string, number>();
    for (const item of items) counts.set(item.status, (counts.get(item.status) ?? 0) + 1);
    console.log(`共 ${items.length} 条：${[...counts.entries()].map(([status, count]) => `${status}=${count}`).join(" ")}`);
    for (const item of items) {
      if (item.status !== "completed") console.log(`  ${item.key} ${item.status} ${item.error ?? ""}`);
    }
    return;
  }

  if (command === "item") {
    const key = rest[0];
    if (!key) throw new Error("用法：item <key>");
    const items = (await listItems(config)).filter((entry) => entry.key === key);
    for (const item of items) {
      const detail = await instanceRequest<{ result: Record<string, unknown> }>(config, "GET", `/items/${encodeURIComponent(item.id)}`);
      console.log(JSON.stringify(detail.result, null, 2));
      const logs = await instanceRequest<{ result: unknown }>(config, "GET", `/items/${encodeURIComponent(item.id)}/logs`);
      console.log("logs:", JSON.stringify(logs.result, null, 2));
    }
    return;
  }

  if (command === "reindex") {
    const status = rest[0] ?? "queued";
    const items = (await listItems(config)).filter((entry) => entry.status === status);
    for (const item of items) {
      await instanceRequest(config, "PATCH", `/items/${encodeURIComponent(item.id)}`, JSON.stringify({ next_action: "INDEX" }));
      console.log(`已重新排队 ${item.key}`);
    }
    return;
  }

  if (command === "set") {
    const patch: Record<string, unknown> = {};
    for (const pair of rest) {
      const index = pair.indexOf("=");
      if (index <= 0) throw new Error(`参数格式应为 key=value：${pair}`);
      patch[pair.slice(0, index)] = parseValue(pair.slice(index + 1));
    }
    const result = await updateInstance(config, patch);
    for (const key of Object.keys(patch)) console.log(`${key}: ${JSON.stringify(result[key])}`);
    return;
  }

  throw new Error("用法：show | items | set key=value ...");
}

main();
