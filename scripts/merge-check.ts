import assert from "node:assert/strict";
import { resources } from "@/data/resources";
import { mergeSearchResults } from "@/lib/resource-search";

// 语义命中里有页面数据中不存在的 id（索引残留已删除的资源）并且分数最高时，页面上存在的资源不能被截断线丢弃。
// 用法：npx tsx scripts/merge-check.ts

const existing = resources[0];
const merged = mergeSearchResults([], [
  { id: "does-not-exist", score: 0.9 },
  { id: existing.id, score: 0.6 },
]);
assert.deepEqual(
  merged.map((resource) => resource.id),
  [existing.id],
);
console.log("mergeSearchResults 检查通过");
