import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BackToTop } from "@/components/back-to-top";
import { HtmlLangSync } from "@/components/html-lang-sync";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CategoryFilters } from "@/components/category-filters";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { resources } from "@/data/resources";
import { categoryFromSlug, categoryMeta, categorySlug, type Language, ui } from "@/lib/resource-helpers";

export function CategoryPage({ language, slug }: { language: Language; slug: string }) {
  const category = categoryFromSlug(slug);

  if (!category) {
    notFound();
  }

  const copy = ui[language];
  const meta = categoryMeta[category];
  const items = resources.filter((resource) => resource.category === category);
  const Icon = meta.icon;
  const homeHref = language === "en" ? "/en" : "/";
  const zhCategoryHref = `/category/${categorySlug(category)}`;
  const enCategoryHref = `/en/category/${categorySlug(category)}`;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fbfbfa_0%,#f3f4f6_100%)] text-slate-950">
      <HtmlLangSync language={language} />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-30 mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/88 px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={homeHref}>
                <ArrowLeft className="h-4 w-4" />
                {copy.overview}
              </Link>
            </Button>
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
          </div>

          <LanguageSwitcher language={language} zhHref={zhCategoryHref} enHref={enCategoryHref} />
        </header>

        <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:px-10 sm:py-12">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-500">{copy.browseCategory}</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                {language === "zh" ? meta.zh : meta.en}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                {language === "zh" ? meta.zhDesc : meta.enDesc}
              </p>
            </div>
            <Card className="rounded-2xl border-slate-200 bg-slate-50/70 shadow-none">
              <div className="flex flex-col gap-3 p-4">
                <div className="text-xs uppercase leading-none tracking-wide text-slate-400">
                  {copy.officialLinks}
                </div>
                <div className="text-2xl font-semibold leading-none text-slate-950">
                  {items.length}
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="mt-8">
          <CategoryFilters items={items} language={language} />
        </section>
      </div>

      <BackToTop language={language} />
    </main>
  );
}
