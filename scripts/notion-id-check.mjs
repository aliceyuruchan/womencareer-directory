import assert from "node:assert/strict";
import { normalizePage } from "./sync-notion-resources.mjs";

// 本地检查 normalizePage 对 ID 列的校验：用构造的 Notion 页面对象调用，不访问 Notion。
// 用法：node scripts/notion-id-check.mjs

const text = (value) => ({ rich_text: value ? [{ plain_text: value }] : [] });

function buildPage(id) {
  return {
    id: "page-under-test",
    properties: {
      ID: text(id),
      Slug: text("test-resource"),
      Name: { title: [{ plain_text: "Test Resource" }] },
      "Short Description": text("A resource used by notion-id-check."),
      Category: { select: { name: "Tool" } },
      Tags: { multi_select: [{ name: "Test" }] },
      Region: { select: { name: "Global" } },
      Type: text("Productivity Tool"),
      Language: { multi_select: [{ name: "English" }] },
      Cost: { select: { name: "Free" } },
      Status: { select: { name: "Active" } },
      "Official URL": { url: "https://example.com/" },
      Featured: { checkbox: false },
    },
  };
}

assert.equal(normalizePage(buildPage("098")).id, "098");
assert.equal(normalizePage(buildPage("resource-abc-1")).id, "resource-abc-1");

for (const badId of ["", "12 3", "中文", "a".repeat(65)]) {
  assert.throws(
    () => normalizePage(buildPage(badId)),
    (error) => error.message.includes("page-under-test") && error.message.includes("Test Resource"),
  );
}

console.log("normalizePage 的 ID 校验检查通过");
