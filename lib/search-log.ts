// 搜索日志的页面端：生成匿名会话 id，用 navigator.sendBeacon 把搜索记录与点击记录发到 /api/log。
// 会话 id 存在 sessionStorage，关闭标签页后失效；不记录任何能识别用户的信息。

import type { SemanticHit } from "@/lib/resource-search";

const SESSION_KEY = "wc-search-session";

export interface SearchLogRecord {
  id: string;
  query: string;
  language: "zh" | "en";
  literalIds: string[];
  semanticHits: SemanticHit[] | null;
  semanticUnknownIds: string[] | null;
  shownIds: string[];
  // pending 只表示结果到达之前用户点击、换了查询或离开了页面
  semanticStatus: "ok" | "error" | "pending";
  semanticHttpStatus: number | null;
  semanticCache: "hit" | "miss" | null;
  semanticAttempts: number | null;
  semanticMs: number | null;
  dataVersion: string;
  submittedAt: number;
}

export interface ClickLogRecord {
  searchId: string;
  resourceId: string;
  position: number;
  source: "literal" | "semantic";
}

export function newSearchId() {
  return crypto.randomUUID();
}

function sessionId() {
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_KEY, created);
  return created;
}

function send(body: Record<string, unknown>) {
  const blob = new Blob([JSON.stringify({ ...body, sessionId: sessionId() })], { type: "application/json" });
  if (!navigator.sendBeacon("/api/log", blob)) {
    throw new Error("sendBeacon 被浏览器拒绝");
  }
}

export function sendSearchLog(record: SearchLogRecord) {
  send({ type: "search", ...record });
}

export function sendClickLog(record: ClickLogRecord) {
  send({ type: "click", ...record });
}
