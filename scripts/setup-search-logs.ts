import fs from "node:fs";
import path from "node:path";
import { d1Batch } from "@/lib/d1-http";
import { loadConfig } from "./ai-search-client";

// 在 .env.local 的 Cloudflare 账号（AI Search 实例所在的账号）里准备搜索日志数据库：
// 没有同名数据库就创建，再执行 migrations/0001_search_logs.sql（CREATE ... IF NOT EXISTS，重复执行不改变已有数据），
// 最后输出数据库 id，填入 Pages 项目的 CF_D1_DATABASE_ID。token 需要 D1 Edit 权限。
// 用法：npx tsx scripts/setup-search-logs.ts [--name womencareer-search-logs]

const args = process.argv.slice(2);
const nameIndex = args.indexOf("--name");
const name = nameIndex >= 0 ? args[nameIndex + 1] : "womencareer-search-logs";
const MIGRATION = path.join(process.cwd(), "migrations", "0001_search_logs.sql");

const config = loadConfig();
const API = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(config.accountId)}/d1/database`;

async function cloudflare<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${config.apiToken}`, "Content-Type": "application/json" },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${init.method ?? "GET"} ${url} 失败 HTTP ${response.status}: ${text.slice(0, 500)}`);
  return (JSON.parse(text) as { result: T }).result;
}

async function findOrCreate(): Promise<string> {
  const existing = await cloudflare<{ uuid: string; name: string }[]>(`${API}?name=${encodeURIComponent(name)}`);
  const match = existing.find((database) => database.name === name);
  if (match) {
    console.log(`已有数据库 ${name}`);
    return match.uuid;
  }
  const created = await cloudflare<{ uuid: string }>(API, { method: "POST", body: JSON.stringify({ name }) });
  console.log(`已创建数据库 ${name}`);
  return created.uuid;
}

async function main() {
  const databaseId = await findOrCreate();
  const d1 = { accountId: config.accountId, databaseId, apiToken: config.apiToken };
  await d1Batch(d1, [{ sql: fs.readFileSync(MIGRATION, "utf8") }]);
  const [tables] = await d1Batch<{ name: string }>(d1, [
    { sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('search_logs', 'search_clicks') ORDER BY name" },
  ]);
  const names = tables.results.map((row) => row.name).join(",");
  if (names !== "search_clicks,search_logs") throw new Error(`建表后数据表不完整：${names}`);
  console.log(`数据表 search_logs、search_clicks 已就绪`);
  console.log(`CF_D1_DATABASE_ID=${databaseId}`);
}

main();
