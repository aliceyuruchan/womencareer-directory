import fs from "node:fs";
import path from "node:path";

// Cloudflare AI Search REST 客户端，供索引同步与离线评测脚本共用。凭据来自仓库根目录的 .env.local。

export interface AiSearchConfig {
  accountId: string;
  instance: string;
  apiToken: string;
}

export interface IndexItem {
  id: string;
  key: string;
  status: string;
  next_action?: string | null;
  metadata?: Record<string, string>;
  error?: string | null;
}

export interface SearchOptions {
  retrievalType?: "hybrid" | "vector" | "keyword";
  maxResults?: number;
  matchThreshold?: number;
  rerank?: { threshold: number } | false;
  rewrite?: boolean;
}

export interface SearchHit {
  id: string;
  score: number;
}

export interface SearchResult {
  hits: SearchHit[];
  chunkCount: number;
  keywordCount: number | null;
  vectorCount: number | null;
  durationMs: number;
}

const API_BASE = "https://api.cloudflare.com/client/v4";
const PAGE_SIZE = 50;

export function loadConfig(): AiSearchConfig {
  const envPath = path.join(process.cwd(), ".env.local");
  const values: Record<string, string> = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    values[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
  }

  const config = {
    accountId: values.CF_ACCOUNT_ID ?? "",
    instance: values.CF_AI_SEARCH_INSTANCE ?? "",
    apiToken: values.CF_API_TOKEN ?? "",
  };
  const missing = Object.entries(config).filter(([, value]) => !value).map(([key]) => key);
  if (missing.length > 0) {
    throw new Error(`.env.local 缺少 ${missing.join(", ")}（需要 CF_ACCOUNT_ID / CF_AI_SEARCH_INSTANCE / CF_API_TOKEN）`);
  }
  return config;
}

export function instanceUrl(config: AiSearchConfig, suffix = "") {
  return `${API_BASE}/accounts/${config.accountId}/ai-search/instances/${config.instance}${suffix}`;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 索引构建期间 Cloudflare 会对请求返回 5xx，query rewrite 偶发 400 ai_gateway_timeout；等待后重试，三次仍失败就抛出。
export async function instanceRequest<T>(
  config: AiSearchConfig,
  method: string,
  suffix: string,
  body?: string | FormData,
  attempt = 1,
): Promise<T> {
  const headers: Record<string, string> = { Authorization: `Bearer ${config.apiToken}` };
  if (typeof body === "string") headers["Content-Type"] = "application/json";
  const response = await fetch(instanceUrl(config, suffix), { method, headers, body });
  const text = await response.text();
  const transient = response.status >= 500 || (response.status === 400 && text.includes("ai_gateway_timeout"));
  if (transient && attempt < 3) {
    await sleep(10000 * attempt);
    return instanceRequest<T>(config, method, suffix, body, attempt + 1);
  }
  if (!response.ok) {
    throw new Error(`Cloudflare ${method} ${suffix} 失败 HTTP ${response.status}: ${text.slice(0, 300)}`);
  }
  const payload = text ? JSON.parse(text) : { success: true };
  if (payload.success === false) {
    throw new Error(`Cloudflare ${method} ${suffix} 返回失败: ${JSON.stringify(payload.errors).slice(0, 300)}`);
  }
  return payload as T;
}

export async function getInstance(config: AiSearchConfig) {
  const payload = await instanceRequest<{ result: Record<string, unknown> }>(config, "GET", "");
  return payload.result;
}

export async function updateInstance(config: AiSearchConfig, patch: Record<string, unknown>) {
  const payload = await instanceRequest<{ result: Record<string, unknown> }>(config, "PUT", "", JSON.stringify(patch));
  return payload.result;
}

export async function listItems(config: AiSearchConfig): Promise<IndexItem[]> {
  const items: IndexItem[] = [];
  for (let page = 1; ; page += 1) {
    const payload = await instanceRequest<{ result: IndexItem[] }>(
      config,
      "GET",
      `/items?source=builtin&per_page=${PAGE_SIZE}&page=${page}`,
    );
    items.push(...payload.result);
    if (payload.result.length < PAGE_SIZE) return items;
  }
}

export async function uploadItem(config: AiSearchConfig, key: string, content: string, metadata: Record<string, string>) {
  const form = new FormData();
  form.append("file", new Blob([content], { type: "text/markdown" }), key);
  // metadata 必须作为普通字符串字段提交；以 Blob 提交会被静默忽略。
  form.append("metadata", JSON.stringify(metadata));
  const payload = await instanceRequest<{ result: IndexItem }>(config, "POST", "/items", form);
  return payload.result;
}

export async function deleteItem(config: AiSearchConfig, id: string) {
  await instanceRequest(config, "DELETE", `/items/${encodeURIComponent(id)}`);
}

function vectorCountOf(payload: { result: { chunks?: unknown[]; hybrid_meta?: { vector_result_count?: number } } }) {
  return payload.result.hybrid_meta?.vector_result_count ?? (payload.result.chunks ?? []).length;
}

export async function search(config: AiSearchConfig, query: string, options: SearchOptions = {}): Promise<SearchResult> {
  const retrieval: Record<string, unknown> = {
    retrieval_type: options.retrievalType ?? "hybrid",
    max_num_results: options.maxResults ?? 50,
  };
  if (retrieval.retrieval_type === "hybrid") retrieval.keyword_match_mode = "or";
  if (options.matchThreshold !== undefined) retrieval.match_threshold = options.matchThreshold;

  const body = JSON.stringify({
    messages: [{ role: "user", content: query }],
    ai_search_options: {
      retrieval,
      reranking: options.rerank
        ? { enabled: true, model: "@cf/baai/bge-reranker-base", match_threshold: options.rerank.threshold }
        : { enabled: false },
      query_rewrite: { enabled: options.rewrite ?? false },
      cache: { enabled: false },
    },
  });

  type SearchPayload = {
    result: {
      chunks: { score: number; item: { key: string; metadata?: Record<string, string> } }[];
      hybrid_meta?: { keyword_result_count?: number; vector_result_count?: number };
    };
  };

  // 向量路偶发返回 0 条（多见于某个查询文本第一次被嵌入时），此时重新请求，最多三次。
  const started = Date.now();
  let payload = await instanceRequest<SearchPayload>(config, "POST", "/search", body);
  for (let attempt = 2; attempt <= 3 && retrieval.retrieval_type !== "keyword" && vectorCountOf(payload) === 0; attempt += 1) {
    await sleep(300);
    payload = await instanceRequest<SearchPayload>(config, "POST", "/search", body);
  }

  const seen = new Set<string>();
  const hits: SearchHit[] = [];
  for (const chunk of payload.result.chunks ?? []) {
    const id = String(chunk.item.metadata?.resourceid ?? "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    hits.push({ id, score: chunk.score });
  }

  return {
    hits,
    chunkCount: (payload.result.chunks ?? []).length,
    keywordCount: payload.result.hybrid_meta?.keyword_result_count ?? null,
    vectorCount: payload.result.hybrid_meta?.vector_result_count ?? null,
    durationMs: Date.now() - started,
  };
}
