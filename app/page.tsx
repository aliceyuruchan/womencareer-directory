"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Code,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Link2,
  Mic,
  Newspaper,
  Search,
  X,
  Sparkles,
  Target,
  Telescope,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { resources, type Resource } from "@/data/resources";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Language = "zh" | "en";

interface CategoryMeta {
  icon: LucideIcon;
  zh: string;
  en: string;
  zhDesc: string;
  enDesc: string;
}

const categoryMeta: Record<Resource["category"], CategoryMeta> = {
  Community: {
    icon: Users,
    zh: "社群",
    en: "Community",
    zhDesc: "职业网络、同行组织与互助小组。",
    enDesc: "Professional networks and peer groups.",
  },
  Learning: {
    icon: GraduationCap,
    zh: "学习",
    en: "Learning",
    zhDesc: "课程、训练营与技能提升资源。",
    enDesc: "Courses, training, and skill builders.",
  },
  Book: {
    icon: BookOpen,
    zh: "书籍",
    en: "Books",
    zhDesc: "关于成长、领导力与职业路径的精选阅读。",
    enDesc: "Recommended reading for growth and leadership.",
  },
  Scholarship: {
    icon: Landmark,
    zh: "奖学金",
    en: "Scholarships",
    zhDesc: "支持教育、转型与职业机会的资助项目。",
    enDesc: "Funding for education and career access.",
  },
  Fellowship: {
    icon: Target,
    zh: "奖助项目",
    en: "Fellowships",
    zhDesc: "提供实践、曝光与支持的结构化项目。",
    enDesc: "Structured programs for experience and exposure.",
  },
  Mentorship: {
    icon: HeartHandshake,
    zh: "导师制",
    en: "Mentorship",
    zhDesc: "导师、赞助人与职业指导资源。",
    enDesc: "Mentors, sponsors, and guided support.",
  },
  Conference: {
    icon: CalendarDays,
    zh: "会议",
    en: "Conferences",
    zhDesc: "会议、峰会、工作坊与线下聚会。",
    enDesc: "Conferences, summits, and meetups.",
  },
  Tool: {
    icon: Workflow,
    zh: "工具",
    en: "Tools",
    zhDesc: "求职、规划与职业管理工具。",
    enDesc: "Career planning and job search utilities.",
  },
  Podcast: {
    icon: Mic,
    zh: "播客",
    en: "Podcasts",
    zhDesc: "职业故事、访谈与行业观察。",
    enDesc: "Audio interviews and career stories.",
  },
  Newsletter: {
    icon: Newspaper,
    zh: "通讯",
    en: "Newsletters",
    zhDesc: "精选职业资讯与行业洞察。",
    enDesc: "Curated career news and industry insights.",
  },
  Research: {
    icon: Telescope,
    zh: "研究",
    en: "Research",
    zhDesc: "关于女性职场与机会差距的报告。",
    enDesc: "Reports and evidence on women at work.",
  },
  "Open Source": {
    icon: Code,
    zh: "开源",
    en: "Open Source",
    zhDesc: "社区维护的精选资源列表与课程。",
    enDesc: "Community-maintained resource lists and curricula.",
  },
};

const categoryOrder: Resource["category"][] = [
  "Community",
  "Learning",
  "Book",
  "Scholarship",
  "Fellowship",
  "Mentorship",
  "Conference",
  "Tool",
  "Podcast",
  "Newsletter",
  "Research",
  "Open Source",
];

const ui = {
  zh: {
    headerSubtitle: "全球女性职业资源精选目录",
    officialLinks: "仅收录官方链接",
    eyebrow: "轻量、精选、可验证的资源索引",
    title: "女性职业资源目录",
    subtitle: "查找全球可信赖的职业社群、学习资源与发展机会。",
    searchLabel: "搜索资源",
    searchPlaceholder: "搜索社群、奖学金、活动、工具或职业机会",
    primaryCta: "探索职业社群",
    secondaryCta: "浏览学习资源",
    clearSearch: "清除搜索",
    noResults: "没有找到匹配资源。换个关键词试试。",
    categoryEyebrow: "按类别浏览",
    categoryTitle: "资源分类",
    featuredEyebrow: "精选收录",
    featuredTitle: "推荐资源",
    allEyebrow: "完整目录",
    allTitle: "全部资源",
    metadata: { region: "地区", type: "类型", cost: "费用", language: "语言" },
    visit: "访问官网",
    count: "条",
    footer: "womenCareer.cn — 女性职业发展资源精选目录",
    disclaimer: "所有链接均指向官方来源。",
  },
  en: {
    headerSubtitle: "Curated global career resources",
    officialLinks: "Official links only",
    eyebrow: "A lightweight curated directory",
    title: "Women's Career Resource Directory",
    subtitle:
      "Find trusted career communities, learning resources, and opportunities worldwide.",
    searchLabel: "Search resources",
    searchPlaceholder: "Search communities, scholarships, events, and tools",
    primaryCta: "Explore Communities",
    secondaryCta: "Browse Learning Resources",
    clearSearch: "Clear search",
    noResults: "No matching resources. Try another keyword.",
    categoryEyebrow: "Browse by category",
    categoryTitle: "Categories",
    featuredEyebrow: "Curated picks",
    featuredTitle: "Featured resources",
    allEyebrow: "Full directory",
    allTitle: "All resources",
    metadata: { region: "Region", type: "Type", cost: "Cost", language: "Language" },
    visit: "Visit Website",
    count: "items",
    footer: "womenCareer.cn — A curated directory of women's career resources",
    disclaimer: "All links point to official sources.",
  },
} satisfies Record<Language, {
  headerSubtitle: string;
  officialLinks: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  searchLabel: string;
  searchPlaceholder: string;
  primaryCta: string;
  secondaryCta: string;
  clearSearch: string;
  noResults: string;
  categoryEyebrow: string;
  categoryTitle: string;
  featuredEyebrow: string;
  featuredTitle: string;
  allEyebrow: string;
  allTitle: string;
  metadata: { region: string; type: string; cost: string; language: string };
  visit: string;
  count: string;
  footer: string;
  disclaimer: string;
}>;

const motionList = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

function categoryAnchor(category: Resource["category"]) {
  return `category-${category.toLowerCase().replace(/\s+/g, "-")}`;
}

function matchesQuery(resource: Resource, query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return [
    resource.name,
    resource.shortDescription,
    resource.category,
    resource.region,
    resource.type,
    resource.cost,
    resource.status,
    resource.officialUrl,
    ...resource.language,
    ...resource.tags,
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

function ResourceCard({ resource, copy }: { resource: Resource; copy: (typeof ui)[Language] }) {
  return (
    <Card className="overflow-hidden border-border/70 bg-white/92">
      <CardContent className="p-0">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">{resource.name}</h3>
              <Badge variant="outline" className="bg-slate-50">
                {resource.status}
              </Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {resource.shortDescription}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {resource.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground lg:min-w-80">
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide">{copy.metadata.region}</div>
              <div className="mt-1 font-medium text-foreground">{resource.region}</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide">{copy.metadata.type}</div>
              <div className="mt-1 font-medium text-foreground">{resource.type}</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide">{copy.metadata.cost}</div>
              <div className="mt-1 font-medium text-foreground">{resource.cost}</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide">{copy.metadata.language}</div>
              <div className="mt-1 font-medium text-foreground">
                {resource.language.join(", ")}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border/60 bg-white/55 px-5 py-4 sm:px-6">
          <span className="truncate text-sm text-muted-foreground">{resource.officialUrl}</span>
          <Button asChild variant="outline" size="sm">
            <a href={resource.officialUrl} target="_blank" rel="noreferrer">
              {copy.visit}
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [language, setLanguage] = useState<Language>("zh");
  const [query, setQuery] = useState("");
  const copy = ui[language];

  const featured = useMemo(() => resources.filter((r) => r.featured), []);

  const filteredResources = useMemo(
    () => resources.filter((resource) => matchesQuery(resource, query)),
    [query],
  );

  const grouped = useMemo(
    () =>
      categoryOrder
        .map((category) => ({
          category,
          meta: categoryMeta[category],
          items: filteredResources.filter((r) => r.category === category),
        }))
        .filter((group) => group.items.length > 0),
    [filteredResources],
  );

  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.85),transparent_48%),radial-gradient(circle_at_20%_20%,rgba(199,210,254,0.42),transparent_26%),radial-gradient(circle_at_80%_10%,rgba(251,191,36,0.14),transparent_22%)]" />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8"
      >
        {/* Header */}
        <header className="glass sticky top-4 z-20 mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 px-4 py-3 shadow-sm">
          <div>
            <p className="text-sm font-semibold tracking-tight">womenCareer.cn</p>
            <p className="text-xs text-muted-foreground">{copy.headerSubtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-1 rounded-md border border-border bg-white/70 p-1">
              {(["zh", "en"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLanguage(item)}
                  className={`h-8 rounded px-3 text-xs font-medium transition ${
                    language === item
                      ? "bg-slate-950 text-white shadow-sm"
                      : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                  }`}
                  aria-pressed={language === item}
                >
                  {item === "zh" ? "中文" : "EN"}
                </button>
              ))}
            </div>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a href="#all-resources">
                <Link2 className="h-4 w-4" />
                {copy.officialLinks}
              </a>
            </Button>
          </div>
        </header>

        {/* Hero */}
        <section className="relative flex flex-col items-center pb-14 pt-8 text-center">
          <motion.div
            animate={{ y: [0, -10, 0], x: [0, 8, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-1/2 top-4 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-slate-200/50 blur-3xl"
          />
          <motion.div
            variants={motionList}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.45 }}
            className="max-w-4xl"
          >
            <Badge className="mb-5 bg-white/80 px-3 py-1 text-slate-700 shadow-sm">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              {copy.eyebrow}
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              {copy.title}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              {copy.subtitle}
            </p>

            <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-border/70 bg-white/85 p-2 shadow-soft">
              <div className="flex items-center gap-2">
                <Search className="ml-3 h-4 w-4 text-muted-foreground" />
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
                    className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-slate-100 hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="min-w-44 gap-2">
                <a href={`#${categoryAnchor("Community")}`}>
                  {copy.primaryCta}
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="secondary" size="lg" className="min-w-44">
                <a href={`#${categoryAnchor("Learning")}`}>{copy.secondaryCta}</a>
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Categories */}
        <section className="pb-16">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{copy.categoryEyebrow}</p>
              <h2 className="text-2xl font-semibold tracking-tight">{copy.categoryTitle}</h2>
            </div>
          </div>

          <motion.div
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {grouped.map((group) => {
              const Icon = group.meta.icon;
              return (
                <motion.div key={group.category} variants={motionList}>
                  <a href={`#${categoryAnchor(group.category)}`} className="block h-full">
                    <Card className="group h-full border-border/70 bg-white/90 transition-shadow duration-200 hover:shadow-soft">
                      <CardHeader className="flex-row items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-transform duration-200 group-hover:scale-105">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <CardTitle>
                            {language === "zh" ? group.meta.zh : group.meta.en}
                          </CardTitle>
                          <CardDescription>
                            {language === "zh" ? group.meta.zhDesc : group.meta.enDesc}
                          </CardDescription>
                          <p className="pt-1 text-xs font-medium text-muted-foreground">
                            {group.items.length} {copy.count}
                          </p>
                        </div>
                      </CardHeader>
                    </Card>
                  </a>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* Featured */}
        <section id="featured-resources" className="scroll-mt-28 pb-16">
          <div className="mb-5">
            <p className="text-sm font-medium text-muted-foreground">{copy.featuredEyebrow}</p>
            <h2 className="text-2xl font-semibold tracking-tight">{copy.featuredTitle}</h2>
          </div>

          <motion.div
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.12 }}
            className="grid gap-4"
          >
            {featured.map((resource) => (
              <motion.div
                key={resource.id}
                variants={motionList}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <ResourceCard resource={resource} copy={copy} />
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* All resources grouped by category */}
        <section id="all-resources" className="scroll-mt-28 pb-16">
          <div className="mb-5">
            <p className="text-sm font-medium text-muted-foreground">{copy.allEyebrow}</p>
            <h2 className="text-2xl font-semibold tracking-tight">{copy.allTitle}</h2>
          </div>

          {grouped.length === 0 ? (
            <Card className="border-border/70 bg-white/90">
              <CardContent className="p-6 text-sm text-muted-foreground">
                {copy.noResults}
              </CardContent>
            </Card>
          ) : null}

          {grouped.map((group) => {
            const Icon = group.meta.icon;
            return (
              <div
                key={group.category}
                id={categoryAnchor(group.category)}
                className="mb-12 scroll-mt-28"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight">
                    {language === "zh" ? group.meta.zh : group.meta.en}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {group.items.length} {copy.count}
                  </span>
                </div>

                <motion.div
                  variants={{ show: { transition: { staggerChildren: 0.06 } } }}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.08 }}
                  className="grid gap-4"
                >
                  {group.items.map((resource) => (
                    <motion.div
                      key={resource.id}
                      variants={motionList}
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ResourceCard resource={resource} copy={copy} />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            );
          })}
        </section>

        {/* Footer */}
        <footer className="mt-auto border-t border-border/60 py-8 text-sm text-muted-foreground">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>{copy.footer}</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-foreground">
                GitHub
              </a>
              <span>{copy.disclaimer}</span>
            </div>
          </div>
        </footer>
      </motion.div>
    </main>
  );
}
