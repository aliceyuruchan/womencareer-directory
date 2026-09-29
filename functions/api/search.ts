// Pages Function：GET /api/search?q=关键词
// 把查询转发到 Cloudflare AI Search，返回相关资源的 id 与分数；资源内容由页面本地的 data/resources.ts 提供。

interface Env {
  CF_ACCOUNT_ID: string;
  CF_AI_SEARCH_INSTANCE: string;
  CF_AI_SEARCH_TOKEN: string;
}

interface PagesContext {
  request: Request;
  env: Env;
  waitUntil(promise: Promise<unknown>): void;
}

interface SearchChunk {
  score: number;
  item: { key: string; metadata?: Record<string, string> };
}

interface SearchPayload {
  success: boolean;
  result: {
    chunks?: SearchChunk[];
    hybrid_meta?: { keyword_result_count?: number; vector_result_count?: number };
  };
}

// 检索参数由 scripts/search-eval.ts 在 65 条标注查询上选出：纯向量召回，不开 reranker 与 query rewrite。
// 页面只保留分数不低于最高分 85% 的前 12 条（lib/resource-search.ts），这里取 20 条留出余量。
const MAX_QUERY_LENGTH = 100;
const MAX_RESULTS = 20;
const EDGE_CACHE_SECONDS = 600;
const SEARCH_ATTEMPTS = 2;
const RETRY_DELAY_MS = 300;

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const url = new URL(context.request.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  if (!query || query.length > MAX_QUERY_LENGTH) {
    return json({ error: "invalid_query" }, 400);
  }

  const cacheKey = new Request(`${url.origin}/api/search?q=${encodeURIComponent(query)}`);
  const cache = (caches as unknown as { default: Cache }).default;
  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  // 向量路偶发返回 0 条（多见于某个查询文本第一次被嵌入时），此时重新请求一次；乱码查询本来就是 0 条，多付一次请求。
  const started = Date.now();
  let attempts = 1;
  let payload = await searchAiSearch(context.env, query);
  while (attempts < SEARCH_ATTEMPTS && vectorCountOf(payload) === 0) {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    payload = await searchAiSearch(context.env, query);
    attempts += 1;
  }
  const hits = extractHits(payload.result.chunks ?? []);
  const meta = {
    keyword: payload.result.hybrid_meta?.keyword_result_count ?? null,
    vector: payload.result.hybrid_meta?.vector_result_count ?? null,
    attempts,
    ms: Date.now() - started,
  };

  console.log(JSON.stringify({ event: "search", query, hits: hits.length, ...meta }));

  const response = json({ query, hits, meta }, 200, {
    "Cache-Control": `public, max-age=60, s-maxage=${EDGE_CACHE_SECONDS}`,
  });
  context.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

async function searchAiSearch(env: Env, query: string): Promise<SearchPayload> {
  const missing = ["CF_ACCOUNT_ID", "CF_AI_SEARCH_INSTANCE", "CF_AI_SEARCH_TOKEN"].filter((name) => !env[name as keyof Env]);
  if (missing.length > 0) {
    throw new Error(`缺少环境变量: ${missing.join(", ")}`);
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CF_ACCOUNT_ID)}/ai-search/instances/${encodeURIComponent(env.CF_AI_SEARCH_INSTANCE)}/search`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CF_AI_SEARCH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: query }],
      ai_search_options: {
        retrieval: {
          retrieval_type: "vector",
          max_num_results: MAX_RESULTS,
        },
        reranking: { enabled: false },
        query_rewrite: { enabled: false },
        cache: { enabled: false },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`AI Search HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  const payload = (await response.json()) as SearchPayload;
  if (!payload.success) {
    throw new Error("AI Search 返回 success=false");
  }
  return payload;
}

function vectorCountOf(payload: SearchPayload) {
  return payload.result.hybrid_meta?.vector_result_count ?? (payload.result.chunks ?? []).length;
}

function extractHits(chunks: SearchChunk[]) {
  const seen = new Set<string>();
  const hits: { id: string; score: number }[] = [];
  for (const chunk of chunks) {
    const id = String(chunk.item.metadata?.resourceid ?? "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    hits.push({ id, score: chunk.score });
  }
  return hits;
}

function json(body: unknown, status: number, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}
