// Pages Function：POST /api/log
// 接收页面用 navigator.sendBeacon 上报的搜索记录与点击记录，写入 D1（表结构见 migrations/0001_search_logs.sql）。
// 数据库与 AI Search 实例在同一个 Cloudflare 账号，通过 Cloudflare API 写入（lib/d1-http.ts）；
// AI Search 换账号时，在新账号运行 scripts/setup-search-logs.ts 建库，再改这几个变量，日志随之写到新账号。

import { d1Batch, type D1Statement } from "../../lib/d1-http";
import { MAX_SEARCH_QUERY_LENGTH } from "../../lib/search-limits";

interface Env {
  CF_ACCOUNT_ID: string;
  CF_API_TOKEN: string;
  CF_D1_DATABASE_ID: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

const MAX_BODY_BYTES = 20_000;
const MAX_LIST_LENGTH = 100;
const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/;
const DATA_VERSION_PATTERN = /^[0-9a-f]{16}$/;

class InvalidLog extends Error {}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { env } = context;
  const missing = (["CF_ACCOUNT_ID", "CF_API_TOKEN", "CF_D1_DATABASE_ID"] as const).filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new Error(`缺少环境变量: ${missing.join(", ")}`);
  }
  const text = await context.request.text();
  if (text.length > MAX_BODY_BYTES) {
    return new Response("body_too_large", { status: 413 });
  }

  let statement: D1Statement;
  try {
    const body = JSON.parse(text);
    if (typeof body !== "object" || body === null || Array.isArray(body)) throw new InvalidLog("body 必须是 JSON 对象");
    statement = buildStatement(body, new URL(context.request.url).hostname, Date.now());
  } catch (error) {
    if (error instanceof InvalidLog || error instanceof SyntaxError) {
      return new Response(`invalid_log: ${error.message}`, { status: 400 });
    }
    throw error;
  }

  const now = Date.now();
  await d1Batch({ accountId: env.CF_ACCOUNT_ID, databaseId: env.CF_D1_DATABASE_ID, apiToken: env.CF_API_TOKEN }, [
    statement,
    { sql: "DELETE FROM search_logs WHERE created_at < ?", params: [now - RETENTION_MS] },
    { sql: "DELETE FROM search_clicks WHERE created_at < ?", params: [now - RETENTION_MS] },
  ]);
  return new Response(null, { status: 204 });
}

function buildStatement(body: Record<string, unknown>, host: string, now: number): D1Statement {
  if (body.type === "search") {
    const status = readEnum(body.semanticStatus, ["ok", "error", "pending"], "semanticStatus");
    const semanticHits = readNullable(body.semanticHits, readHits, "semanticHits");
    const unknownIds = readNullable(body.semanticUnknownIds, (value) => readIds(value, "semanticUnknownIds"), "semanticUnknownIds");
    const httpStatus = readNullable(body.semanticHttpStatus, (value) => readInteger(value, "semanticHttpStatus"), "semanticHttpStatus");
    const cache = readNullable(body.semanticCache, (value) => readEnum(value, ["hit", "miss"], "semanticCache"), "semanticCache");
    const attempts = readNullable(body.semanticAttempts, (value) => readInteger(value, "semanticAttempts"), "semanticAttempts");
    const ms = readNullable(body.semanticMs, (value) => readInteger(value, "semanticMs"), "semanticMs");

    // 各个语义字段是否为 NULL 由 semantic_status 决定：ok 时结果字段齐全；error 时只有状态码与耗时；pending 时全部为 NULL
    const present = { semanticHits, unknownIds, httpStatus, cache, attempts, ms };
    const expectedPresent: Record<typeof status, (keyof typeof present)[]> = {
      ok: ["semanticHits", "unknownIds", "cache", "attempts", "ms"],
      error: ["httpStatus", "ms"],
      pending: [],
    };
    for (const [name, value] of Object.entries(present)) {
      if ((value !== null) !== expectedPresent[status].includes(name as keyof typeof present)) {
        throw new InvalidLog(`semanticStatus=${status} 时 ${name} ${value === null ? "不能" : "必须"}为 null`);
      }
    }

    return {
      sql: `INSERT OR IGNORE INTO search_logs
          (id, session_id, query, language, literal_ids, semantic_hits, semantic_unknown_ids, shown_ids,
           semantic_status, semantic_http_status, semantic_cache, semantic_attempts, semantic_ms,
           data_version, submitted_at, host, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        readId(body.id, "id"),
        readId(body.sessionId, "sessionId"),
        readQuery(body.query),
        readEnum(body.language, ["zh", "en"], "language"),
        JSON.stringify(readIds(body.literalIds, "literalIds")),
        semanticHits === null ? null : JSON.stringify(semanticHits),
        unknownIds === null ? null : JSON.stringify(unknownIds),
        JSON.stringify(readIds(body.shownIds, "shownIds")),
        status,
        httpStatus,
        cache,
        attempts,
        ms,
        readDataVersion(body.dataVersion),
        readInteger(body.submittedAt, "submittedAt"),
        host,
        now,
      ],
    };
  }
  if (body.type === "click") {
    return {
      sql: `INSERT INTO search_clicks (search_id, session_id, resource_id, position, source, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
      params: [
        readId(body.searchId, "searchId"),
        readId(body.sessionId, "sessionId"),
        readId(body.resourceId, "resourceId"),
        readInteger(body.position, "position"),
        readEnum(body.source, ["literal", "semantic"], "source"),
        now,
      ],
    };
  }
  throw new InvalidLog("type 只能是 search 或 click");
}

function readId(value: unknown, name: string): string {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) throw new InvalidLog(`${name} 格式不对`);
  return value;
}

function readQuery(value: unknown): string {
  if (typeof value !== "string") throw new InvalidLog("query 必须是字符串");
  const query = value.trim();
  if (!query || query.length > MAX_SEARCH_QUERY_LENGTH) throw new InvalidLog("query 为空或过长");
  return query;
}

function readDataVersion(value: unknown): string {
  if (typeof value !== "string" || !DATA_VERSION_PATTERN.test(value)) throw new InvalidLog("dataVersion 格式不对");
  return value;
}

// 字段必须出现在 body 里：值为 null，或者能被 read 读取
function readNullable<T>(value: unknown, read: (value: unknown) => T, name: string): T | null {
  if (value === undefined) throw new InvalidLog(`缺少字段 ${name}`);
  return value === null ? null : read(value);
}

function readEnum<T extends string>(value: unknown, allowed: T[], name: string): T {
  if (!allowed.includes(value as T)) throw new InvalidLog(`${name} 只能是 ${allowed.join("/")}`);
  return value as T;
}

function readInteger(value: unknown, name: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) throw new InvalidLog(`${name} 必须是非负整数`);
  return value as number;
}

function readIds(value: unknown, name: string): string[] {
  if (!Array.isArray(value) || value.length > MAX_LIST_LENGTH) throw new InvalidLog(`${name} 必须是长度不超过 ${MAX_LIST_LENGTH} 的数组`);
  return value.map((item) => readId(item, name));
}

function readHits(value: unknown): { id: string; score: number }[] {
  if (!Array.isArray(value) || value.length > MAX_LIST_LENGTH) throw new InvalidLog(`semanticHits 必须是长度不超过 ${MAX_LIST_LENGTH} 的数组`);
  return value.map((item) => {
    if (typeof item !== "object" || item === null || typeof item.score !== "number" || !Number.isFinite(item.score)) {
      throw new InvalidLog("semanticHits 的每一项需要 id 与数值 score");
    }
    return { id: readId(item.id, "semanticHits.id"), score: item.score };
  });
}
