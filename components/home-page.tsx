"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Search, Sparkles, X } from "lucide-react";
import { BackToTop } from "@/components/back-to-top";
import { HtmlLangSync } from "@/components/html-lang-sync";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ResourceCard } from "@/components/resource-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export function HomePage({ language }: { language: Language }) {
  const [query, setQuery] = useState("");
  const copy = ui[language];

  const groupedCategories = useMemo(() => getGroupedResources(""), []);
  const filteredResources = useMemo(() => getFilteredResources(query), [query]);
  const hasQuery = query.trim().length > 0;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fbfbfa_0%,#f3f4f6_100%)] text-slate-950">
      <HtmlLangSync language={language} />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-30 mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/88 px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur">
          <div className="flex items-center gap-3">
            <Image
              src="/header-logo.png"
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
          <LanguageSwitcher language={language} zhHref="/" enHref="/en" />
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
              <div className="flex items-center gap-2">
                <Search className="ml-3 h-4 w-4 text-slate-400" />
                <Input
                  aria-label={copy.searchLabel}
                  placeholder={copy.searchPlaceholder}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
                {query ? (
                  <button
                    type="button"
                    aria-label={copy.clearSearch}
                    onClick={() => setQuery("")}
                    className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full px-6">
                <Link href={language === "en" ? `/en/category/${categorySlug("Community")}` : `/category/${categorySlug("Community")}`}>
                  {copy.primaryCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="rounded-full px-6">
                <Link href={language === "en" ? `/en/category/${categorySlug("Learning")}` : `/category/${categorySlug("Learning")}`}>
                  {copy.secondaryCta}
                </Link>
              </Button>
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
                variants={{ show: { transition: { staggerChildren: 0.04 } } }}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.1 }}
                className="grid gap-4"
              >
                {filteredResources.map((resource) => (
                  <motion.div key={resource.id} variants={motionList}>
                    <ResourceCard resource={resource} language={language} />
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>{copy.footer}</p>
            <span>{copy.disclaimer}</span>
          </div>
        </footer>
      </div>

      <BackToTop language={language} />
    </main>
  );
}
