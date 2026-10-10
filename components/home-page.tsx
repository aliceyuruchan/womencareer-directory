"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, X } from "lucide-react";
import { BackToTop } from "@/components/back-to-top";
import { HtmlLangSync } from "@/components/html-lang-sync";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ResourceCard } from "@/components/resource-card";
import { SubmitResourceEntry } from "@/components/submit-resource-entry";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getGroupedResources,
  getFilteredResources,
  categorySlug,
  motionList,
  type Language,
  ui,
} from "@/lib/resource-helpers";
import { mergeSearchResults, unknownSemanticIds, type SemanticHit } from "@/lib/resource-search";
import { newSearchId, sendClickLog, sendSearchLog, type SearchLogRecord } from "@/lib/search-log";
import { MAX_SEARCH_QUERY_LENGTH } from "@/lib/search-limits";
import { RESOURCE_DATA_VERSION, type Resource } from "@/data/resources";

interface SubmittedSearch {
  id: string;
  query: string;
  submittedAt: number;
}

// httpStatus：请求返回非 2xx 时为响应状态码，fetch 本身失败（网络中断）时为 0
type SemanticSearchState =
  | {
      searchId: string;
      status: "ok";
      httpStatus: null;
      hits: SemanticHit[];
      cache: "hit" | "miss";
      attempts: number;
      ms: number;
    }
  | {
      searchId: string;
      status: "error";
      httpStatus: number;
      ms: number;
    };

interface PendingSearchLog {
  record: SearchLogRecord;
  sent: boolean;
}

function flushSearchLog(entry: PendingSearchLog | null) {
  if (!entry || entry.sent) return;
  sendSearchLog(entry.record);
  entry.sent = true;
}

export function HomePage({ language }: { language: Language }) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState<SubmittedSearch | null>(null);
  const [semanticSearch, setSemanticSearch] = useState<SemanticSearchState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const copy = ui[language];

  // 用户按回车（手机键盘上显示为「搜索」键）才开始搜索；同一个查询词重复提交不会重新搜索。
  // 查询词取输入框里显示的文字：页面脚本加载完成之前输入的文字不会经过 onChange 进入 query 状态。
  const submitSearch = () => {
    const input = inputRef.current;
    if (!input) throw new Error("提交搜索时找不到搜索输入框");
    setQuery(input.value);
    const trimmed = input.value.trim();
    if (!trimmed) {
      setSubmitted(null);
      return;
    }
    // 输入框已经用 maxLength 限制长度，超过上限说明代码有问题
    if (trimmed.length > MAX_SEARCH_QUERY_LENGTH) {
      throw new Error(`搜索查询长度 ${trimmed.length} 超过上限 ${MAX_SEARCH_QUERY_LENGTH}`);
    }
    if (submitted?.query !== trimmed) {
      setSubmitted({ id: newSearchId(), query: trimmed, submittedAt: Date.now() });
    }
  };

  const clearSearch = () => {
    setQuery("");
    setSubmitted(null);
  };

  // 提交后字面匹配的结果立即显示，同时向 /api/search 请求语义结果，到达后合并进列表。
  useEffect(() => {
    if (!submitted) {
      setSemanticSearch(null);
      return;
    }

    let cancelled = false;
    const started = performance.now();
    const elapsed = () => Math.round(performance.now() - started);
    // 失败时先写入 error 状态（搜索日志据此上报），再继续抛出原错误
    const fail = (httpStatus: number) => {
      if (!cancelled) setSemanticSearch({ searchId: submitted.id, status: "error", httpStatus, ms: elapsed() });
    };
    (async () => {
      let response: Response;
      try {
        response = await fetch(
          `/api/search?q=${encodeURIComponent(submitted.query)}&v=${RESOURCE_DATA_VERSION}`,
          { cache: "no-store" },
        );
      } catch (error) {
        fail(0);
        throw error;
      }
      if (!response.ok) {
        fail(response.status);
        throw new Error(`/api/search HTTP ${response.status}`);
      }
      const cache = response.headers.get("X-Search-Cache");
      if (cache !== "hit" && cache !== "miss") {
        throw new Error(`/api/search 的 X-Search-Cache 响应头不对：${cache}`);
      }
      const payload = (await response.json()) as { hits: SemanticHit[]; meta: { attempts: number } };
      if (!cancelled) {
        setSemanticSearch({
          searchId: submitted.id,
          status: "ok",
          httpStatus: null,
          hits: payload.hits,
          cache,
          attempts: payload.meta.attempts,
          ms: elapsed(),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [submitted]);

  const groupedCategories = useMemo(() => getGroupedResources(""), []);
  const localResults = useMemo(() => (submitted ? getFilteredResources(submitted.query) : []), [submitted]);
  const readySemantic = semanticSearch && semanticSearch.searchId === submitted?.id ? semanticSearch : null;
  const filteredResources = useMemo(
    () => (readySemantic?.status === "ok" ? mergeSearchResults(localResults, readySemantic.hits) : localResults),
    [localResults, readySemantic],
  );
  const hasQuery = submitted !== null;

  // 搜索日志：每次提交一条记录。语义结果到达或请求失败时上报；在此之前换了查询、清空、离开页面或点击了结果，就按当时显示的列表上报。
  const pendingLog = useRef<PendingSearchLog | null>(null);

  useEffect(() => {
    const previous = pendingLog.current;
    if (submitted && previous?.record.id === submitted.id) {
      if (!previous.sent) {
        previous.record = buildSearchRecord(submitted, language, localResults, filteredResources, readySemantic);
        if (readySemantic) flushSearchLog(previous);
      }
      return;
    }
    flushSearchLog(previous);
    pendingLog.current = submitted
      ? { record: buildSearchRecord(submitted, language, localResults, filteredResources, readySemantic), sent: false }
      : null;
  }, [submitted, language, localResults, filteredResources, readySemantic]);

  useEffect(() => {
    const flushPending = () => flushSearchLog(pendingLog.current);
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushPending();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    // pagehide 覆盖 Safari 的页面缓存
    window.addEventListener("pagehide", flushPending);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flushPending);
      // 站内跳转（例如点击 LanguageSwitcher）卸载 HomePage 时页面仍然可见，在这里上报
      flushPending();
    };
  }, []);

  const handleVisit = useCallback(
    (resource: Resource, index: number) => {
      const entry = pendingLog.current;
      if (!entry) throw new Error("点击搜索结果时没有对应的搜索记录");
      flushSearchLog(entry);
      sendClickLog({
        searchId: entry.record.id,
        resourceId: resource.id,
        position: index + 1,
        source: localResults.some((item) => item.id === resource.id) ? "literal" : "semantic",
      });
    },
    [localResults],
  );

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fbfbfa_0%,#f3f4f6_100%)] text-slate-950">
      <HtmlLangSync language={language} />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-30 mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/88 px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur">
          <div className="flex items-center gap-3">
            <Image
              src="/header-logo.svg"
              alt="Women Career"
              width={657}
              height={657}
              className="h-11 w-11 rounded-sm object-contain sm:h-12 sm:w-12"
              priority
            />
            <div>
              <p className="text-sm font-semibold tracking-tight">Women Career Resources</p>
              <p className="text-xs text-slate-500">{copy.headerSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher language={language} zhHref="/" enHref="/en" />
          </div>
        </header>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),transparent_30%),linear-gradient(135deg,#f8fafc_0%,#eef2f7_42%,#f8fafc_100%)] px-6 py-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:px-10 sm:py-14"
        >
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_20%,rgba(148,163,184,0.16),transparent_24%),radial-gradient(circle_at_80%_50%,rgba(56,189,248,0.12),transparent_18%)]" />
          <div className="relative max-w-3xl">
            <Badge className="mb-5 rounded-full bg-white px-3 py-1 text-slate-700 shadow-sm">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              {copy.eyebrow}
            </Badge>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {copy.headerSubtitle}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              {copy.subtitle}
            </p>

            <div className="mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <form
                role="search"
                className="flex items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitSearch();
                }}
              >
                <Search className="ml-3 h-4 w-4 text-slate-400" />
                <Input
                  ref={inputRef}
                  aria-label={copy.searchLabel}
                  placeholder={copy.searchPlaceholder}
                  value={query}
                  maxLength={MAX_SEARCH_QUERY_LENGTH}
                  enterKeyHint="search"
                  onChange={(event) => {
                    setQuery(event.target.value);
                    if (!event.target.value.trim()) setSubmitted(null);
                  }}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
                {query ? (
                  <button
                    type="button"
                    aria-label={copy.clearSearch}
                    onClick={clearSearch}
                    className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </form>
            </div>

          </div>
        </motion.section>

        <section className="mt-12">
          <div className="mb-5">
            <p className="text-sm font-medium text-slate-500">
              {hasQuery ? copy.allEyebrow : copy.categoryEyebrow}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">
              {hasQuery ? copy.allTitle : copy.categoryTitle}
            </h2>
            {hasQuery ? (
              <p className="mt-2 text-sm text-slate-500">
                {filteredResources.length} {copy.count}
              </p>
            ) : null}
          </div>

          {hasQuery ? (
            filteredResources.length > 0 ? (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.04 } } }}
                className="grid gap-4"
              >
                {filteredResources.map((resource, index) => (
                  <motion.div key={resource.id} variants={motionList}>
                    <ResourceCard resource={resource} language={language} onVisit={() => handleVisit(resource, index)} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 text-sm text-slate-500">
                {copy.noResults}
              </div>
            )
          ) : (
            <motion.div
              variants={{ show: { transition: { staggerChildren: 0.05 } } }}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            >
              {groupedCategories.map((group) => {
                const Icon = group.meta.icon;
                const title = language === "zh" ? group.meta.zh : group.meta.en;
                const description = language === "zh" ? group.meta.zhDesc : group.meta.enDesc;
                const href =
                  language === "en"
                    ? `/en/category/${categorySlug(group.category)}`
                    : `/category/${categorySlug(group.category)}`;

                return (
                  <motion.div key={group.category} variants={motionList}>
                    <Link href={href} className="block h-full">
                      <Card className="h-full rounded-2xl border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                        <CardHeader className="gap-4 p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-medium text-slate-400">
                              {group.items.length} {copy.count}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <CardTitle className="text-lg">{title}</CardTitle>
                            <CardDescription className="text-sm leading-6 text-slate-600">
                              {description}
                            </CardDescription>
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </section>

        <footer className="mt-16 border-t border-slate-200 py-8 text-sm text-slate-500">
          <div className="space-y-3">
            <p>{copy.footer}</p>
            <div className="space-y-1 leading-6">
              <p className="font-medium text-slate-700">{copy.disclaimerTitle}</p>
              <p>
                {copy.disclaimer}{" "}
                <a
                  href="mailto:aliceyuruchan@gmail.com"
                  className="font-medium text-slate-700 underline-offset-4 hover:text-slate-950 hover:underline"
                >
                  aliceyuruchan@gmail.com
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>

      <SubmitResourceEntry language={language} />
      <BackToTop language={language} />
    </main>
  );
}

function buildSearchRecord(
  search: SubmittedSearch,
  language: Language,
  localResults: Resource[],
  shown: Resource[],
  semantic: SemanticSearchState | null,
): SearchLogRecord {
  const base = {
    id: search.id,
    query: search.query,
    language,
    literalIds: localResults.map((resource) => resource.id),
    shownIds: shown.map((resource) => resource.id),
    dataVersion: RESOURCE_DATA_VERSION,
    submittedAt: search.submittedAt,
  };
  if (semantic === null) {
    return {
      ...base,
      semanticStatus: "pending",
      semanticHits: null,
      semanticUnknownIds: null,
      semanticHttpStatus: null,
      semanticCache: null,
      semanticAttempts: null,
      semanticMs: null,
    };
  }
  if (semantic.status === "error") {
    return {
      ...base,
      semanticStatus: "error",
      semanticHits: null,
      semanticUnknownIds: null,
      semanticHttpStatus: semantic.httpStatus,
      semanticCache: null,
      semanticAttempts: null,
      semanticMs: semantic.ms,
    };
  }
  return {
    ...base,
    semanticStatus: "ok",
    semanticHits: semantic.hits,
    semanticUnknownIds: unknownSemanticIds(semantic.hits),
    semanticHttpStatus: null,
    semanticCache: semantic.cache,
    semanticAttempts: semantic.attempts,
    semanticMs: semantic.ms,
  };
}
