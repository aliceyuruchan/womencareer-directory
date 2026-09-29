import crypto from "node:crypto";
import { resources } from "@/data/resources";
import {
  SEARCH_DOCUMENT_PREFIX,
  SEARCH_DOCUMENT_VERSION,
  SEARCH_METADATA_SCHEMA,
  buildSearchDocument,
  buildSearchMetadata,
  searchDocumentKey,
} from "@/lib/resource-search";
import {
  deleteItem,
  getInstance,
  listItems,
  loadConfig,
  updateInstance,
  uploadItem,
  type IndexItem,
} from "./ai-search-client";

// 把 data/resources.ts 同步到 Cloudflare AI Search 索引：声明 metadata schema、上传有变化的文档、删除多余条目、等待索引完成。
// 用法：npx tsx scripts/sync-ai-search.ts [--check]
// --check 只比对差异，不改动索引；有差异时退出码为 1，用于监控索引是否与数据一致。

const MAX_RESULTS = 50;
const INDEX_WAIT_MS = 360000;
const INDEX_POLL_MS = 10000;
const FAILED_STATUSES = new Set(["error", "failed", "skipped"]);

const checkOnly = process.argv.includes("--check");
const config = loadConfig();

interface PlannedDocument {
  key: string;
  document: string;
  metadata: Record<string, string>;
}

const planned: PlannedDocument[] = resources.map((resource) => {
  const document = buildSearchDocument(resource);
  const metadata = buildSearchMetadata(resource);
  const contenthash = crypto
    .createHash("sha256")
    .update(JSON.stringify({ version: SEARCH_DOCUMENT_VERSION, document, metadata }), "utf8")
    .digest("hex");
  return { key: searchDocumentKey(resource), document, metadata: { ...metadata, contenthash } };
});

function isCurrent(item: IndexItem, doc: PlannedDocument) {
  const stored = item.metadata ?? {};
  return (
    stored.contenthash === doc.metadata.contenthash &&
    stored.resourceid === doc.metadata.resourceid &&
    !FAILED_STATUSES.has(item.status) &&
    item.next_action !== "DELETE"
  );
}

async function ensureSchema() {
  const instance = await getInstance(config);
  const declared = ((instance.custom_metadata as { field_name: string; data_type: string }[] | null) ?? [])
    .map((field) => `${field.field_name.toLowerCase()}:${field.data_type}`)
    .join(",");
  const expected = SEARCH_METADATA_SCHEMA.map((field) => `${field.field_name}:${field.data_type}`).join(",");
  const schemaMatches = declared === expected;
  const maxResultsMatches = instance.max_num_results === MAX_RESULTS;
  if (schemaMatches && maxResultsMatches) return false;
  if (checkOnly) {
    console.log(`实例配置有差异：custom_metadata=${declared || "(空)"} max_num_results=${instance.max_num_results}`);
    return true;
  }
  await updateInstance(config, { custom_metadata: [...SEARCH_METADATA_SCHEMA], max_num_results: MAX_RESULTS });
  console.log("已更新实例配置：custom_metadata 与 max_num_results");
  return true;
}

async function waitForIndexing() {
  const deadline = Date.now() + INDEX_WAIT_MS;
  while (true) {
    const items = (await listItems(config)).filter((item) => item.key.startsWith(SEARCH_DOCUMENT_PREFIX));
    const pending = items.filter((item) => !["completed", ...FAILED_STATUSES].includes(item.status));
    const failed = items.filter((item) => FAILED_STATUSES.has(item.status));
    if (pending.length === 0) {
      if (failed.length > 0) {
        for (const item of failed) console.log(`索引失败：${item.key} status=${item.status} error=${item.error ?? ""}`);
        throw new Error(`${failed.length} 条文档索引失败`);
      }
      return items.length;
    }
    if (Date.now() > deadline) {
      throw new Error(`等待索引超时，仍有 ${pending.length} 条未完成：${pending.map((item) => item.key).join(", ")}`);
    }
    console.log(`索引进行中：${items.length - pending.length}/${items.length} 完成`);
    await new Promise((resolve) => setTimeout(resolve, INDEX_POLL_MS));
  }
}

async function main() {
  const schemaChanged = await ensureSchema();
  const items = (await listItems(config)).filter((item) => item.key.startsWith(SEARCH_DOCUMENT_PREFIX));
  const byKey = new Map<string, IndexItem[]>();
  for (const item of items) {
    if (!byKey.has(item.key)) byKey.set(item.key, []);
    byKey.get(item.key)!.push(item);
  }

  const toUpload: PlannedDocument[] = [];
  const toDelete: IndexItem[] = [];
  let unchanged = 0;

  for (const doc of planned) {
    const existing = byKey.get(doc.key) ?? [];
    const current = existing.find((item) => isCurrent(item, doc));
    if (current) {
      unchanged += 1;
      toDelete.push(...existing.filter((item) => item.id !== current.id));
    } else {
      toDelete.push(...existing);
      toUpload.push(doc);
    }
  }
  const plannedKeys = new Set(planned.map((doc) => doc.key));
  for (const [key, group] of byKey) {
    if (!plannedKeys.has(key)) toDelete.push(...group);
  }

  console.log(`数据 ${planned.length} 条，索引 ${items.length} 条：不变 ${unchanged}，待上传 ${toUpload.length}，待删除 ${toDelete.length}`);

  if (checkOnly) {
    for (const doc of toUpload) console.log(`  待上传 ${doc.key}`);
    for (const item of toDelete) console.log(`  待删除 ${item.key} (${item.id})`);
    process.exitCode = schemaChanged || toUpload.length > 0 || toDelete.length > 0 ? 1 : 0;
    return;
  }

  for (const item of toDelete) {
    await deleteItem(config, item.id);
  }
  for (const doc of toUpload) {
    const uploaded = await uploadItem(config, doc.key, doc.document, doc.metadata);
    console.log(`已上传 ${doc.key} -> ${uploaded.id}`);
  }

  if (toUpload.length > 0 || schemaChanged) {
    const total = await waitForIndexing();
    console.log(`索引完成：${total} 条，状态全部 completed`);
  }
}

main();
