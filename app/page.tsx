"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Link2,
  Search,
  Sparkles,
  Users,
  Mic,
  Target,
  Workflow,
  Telescope
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Resource {
  name: string;
  description: string;
  url: string;
  category: string;
  tags: string[];
  region: string;
  type: string;
  cost: string;
  status: string;
}

type Language = "zh" | "en";

const content = {
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
    categoryEyebrow: "按类别浏览",
    categoryTitle: "资源分类",
    featuredEyebrow: "精选收录",
    featuredTitle: "推荐资源",
    metadata: {
      region: "地区",
      type: "类型",
      cost: "费用",
      category: "分类"
    },
    visit: "访问官网",
    footer: "womenCareer.cn — 女性职业发展资源精选目录",
    disclaimer: "所有链接均指向官方来源。",
    categories: [
      { title: "社群", description: "职业网络、同行组织与互助小组。", icon: Users },
      { title: "学习", description: "课程、训练营与技能提升资源。", icon: GraduationCap },
      { title: "书籍", description: "关于成长、领导力与职业路径的精选阅读。", icon: BookOpen },
      { title: "奖学金", description: "支持教育、转型与职业机会的资助项目。", icon: Landmark },
      { title: "奖助项目", description: "提供实践、曝光与支持的结构化项目。", icon: Target },
      { title: "导师制", description: "导师、赞助人与职业指导资源。", icon: HeartHandshake },
      { title: "活动", description: "会议、峰会、工作坊与线下聚会。", icon: CalendarDays },
      { title: "职位", description: "招聘平台、远程机会与职业入口。", icon: BriefcaseBusiness },
      { title: "工具", description: "求职、规划与职业管理工具。", icon: Workflow },
      { title: "播客", description: "职业故事、访谈与行业观察。", icon: Mic },
      { title: "研究", description: "关于女性职场与机会差距的报告。", icon: Telescope }
    ],
    resources: [
      {
        name: "Women Techmakers",
        description: "由 Google 支持的女性科技从业者项目，聚焦可见度、社群与活动。",
        url: "https://www.womentechmakers.com/",
        category: "社群",
        tags: ["科技", "社群", "活动"],
        region: "全球",
        type: "社群网络",
        cost: "免费",
        status: "活跃"
      },
      {
        name: "Women in Product",
        description: "面向产品经理与产品从业者的会员网络、活动与职业支持。",
        url: "https://womeninproduct.com/",
        category: "社群",
        tags: ["产品", "人脉", "领导力"],
        region: "全球",
        type: "职业协会",
        cost: "混合",
        status: "活跃"
      },
      {
        name: "Lean In",
        description: "提供 Lean In Circles、小组资源与职场成长工具包。",
        url: "https://leanin.org/",
        category: "学习",
        tags: ["领导力", "职场", "指南"],
        region: "全球",
        type: "学习平台",
        cost: "免费",
        status: "活跃"
      },
      {
        name: "AnitaB.org",
        description: "推动女性参与计算机领域的项目、研究与会议资源。",
        url: "https://anitab.org/",
        category: "活动",
        tags: ["工程", "研究", "会议"],
        region: "全球",
        type: "非营利组织",
        cost: "混合",
        status: "活跃"
      },
      {
        name: "PowerToFly",
        description: "聚合远程友好职位与包容性招聘资源的职业平台。",
        url: "https://powertofly.com/",
        category: "职位",
        tags: ["远程", "招聘", "职业"],
        region: "全球",
        type: "招聘平台",
        cost: "免费",
        status: "活跃"
      },
      {
        name: "Girls in Tech",
        description: "通过地方分会、活动与项目支持女性进入并发展科技职业。",
        url: "https://girlsintech.org/",
        category: "导师制",
        tags: ["STEM", "导师制", "活动"],
        region: "全球",
        type: "社群组织",
        cost: "免费",
        status: "活跃"
      }
    ] satisfies Resource[]
  },
  en: {
    headerSubtitle: "Curated global career resources",
    officialLinks: "Official links only",
    eyebrow: "A lightweight curated directory",
    title: "Women's Career Resource Directory",
    subtitle: "Find trusted career communities, learning resources, and opportunities worldwide.",
    searchLabel: "Search resources",
    searchPlaceholder: "Search communities, scholarships, events, and tools",
    primaryCta: "Explore Communities",
    secondaryCta: "Browse Learning Resources",
    categoryEyebrow: "Browse by category",
    categoryTitle: "Main navigation",
    featuredEyebrow: "Curated picks",
    featuredTitle: "Featured resources",
    metadata: {
      region: "Region",
      type: "Type",
      cost: "Cost",
      category: "Category"
    },
    visit: "Visit Website",
    footer: "womenCareer.cn — A curated directory of women's career resources",
    disclaimer: "All links point to official sources.",
    categories: [
      { title: "Community", description: "Professional networks and peer groups.", icon: Users },
      { title: "Learning", description: "Courses, training, and skill builders.", icon: GraduationCap },
      { title: "Books", description: "Recommended reading for growth and leadership.", icon: BookOpen },
      { title: "Scholarships", description: "Funding for education and career access.", icon: Landmark },
      { title: "Fellowships", description: "Structured programs for experience and exposure.", icon: Target },
      { title: "Mentorship", description: "Mentors, sponsors, and guided support.", icon: HeartHandshake },
      { title: "Events", description: "Conferences, summits, and meetups.", icon: CalendarDays },
      { title: "Jobs", description: "Hiring boards and opportunity feeds.", icon: BriefcaseBusiness },
      { title: "Tools", description: "Career planning and job search utilities.", icon: Workflow },
      { title: "Podcasts", description: "Audio interviews and career stories.", icon: Mic },
      { title: "Research", description: "Reports and evidence on women at work.", icon: Telescope }
    ],
    resources: [
      {
        name: "Women Techmakers",
        description: "Google-backed programs and visibility for women in technology.",
        url: "https://www.womentechmakers.com/",
        category: "Community",
        tags: ["Tech", "Community", "Events"],
        region: "Global",
        type: "Community Network",
        cost: "Free",
        status: "Active"
      },
      {
        name: "Women in Product",
        description: "Membership, events, and career support for product professionals.",
        url: "https://womeninproduct.com/",
        category: "Community",
        tags: ["Product", "Networking", "Leadership"],
        region: "Global",
        type: "Professional Association",
        cost: "Mixed",
        status: "Active"
      },
      {
        name: "Lean In",
        description: "Circles, articles, and toolkits focused on workplace growth.",
        url: "https://leanin.org/",
        category: "Learning",
        tags: ["Leadership", "Workplace", "Guides"],
        region: "Global",
        type: "Learning Platform",
        cost: "Free",
        status: "Active"
      },
      {
        name: "AnitaB.org",
        description: "Programs, research, and conferences advancing women in computing.",
        url: "https://anitab.org/",
        category: "Events",
        tags: ["Engineering", "Research", "Conferences"],
        region: "Global",
        type: "Nonprofit",
        cost: "Mixed",
        status: "Active"
      },
      {
        name: "PowerToFly",
        description: "Remote-friendly opportunities and inclusive hiring resources.",
        url: "https://powertofly.com/",
        category: "Jobs",
        tags: ["Remote", "Hiring", "Career"],
        region: "Global",
        type: "Jobs Platform",
        cost: "Free",
        status: "Active"
      },
      {
        name: "Girls in Tech",
        description: "Chapters, events, and programs supporting women in technology.",
        url: "https://girlsintech.org/",
        category: "Mentorship",
        tags: ["STEM", "Mentorship", "Events"],
        region: "Global",
        type: "Community Organization",
        cost: "Free",
        status: "Active"
      }
    ] satisfies Resource[]
  }
};

const motionList = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 }
};

export default function Home() {
  const [language, setLanguage] = useState<Language>("zh");
  const copy = content[language];

  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.85),transparent_48%),radial-gradient(circle_at_20%_20%,rgba(199,210,254,0.42),transparent_26%),radial-gradient(circle_at_80%_10%,rgba(251,191,36,0.14),transparent_22%)]" />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8"
      >
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
            <Button variant="outline" size="sm" className="gap-1.5">
              <Link2 className="h-4 w-4" />
              {copy.officialLinks}
            </Button>
          </div>
        </header>

        <section className="relative flex flex-col items-center pb-14 pt-8 text-center">
          <motion.div
            animate={{ y: [0, -10, 0], x: [0, 8, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-1/2 top-4 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-slate-200/50 blur-3xl"
          />
          <motion.div variants={motionList} initial="hidden" animate="show" transition={{ duration: 0.45 }} className="max-w-4xl">
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
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="min-w-44 gap-2">
                {copy.primaryCta}
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="lg" className="min-w-44">
                {copy.secondaryCta}
              </Button>
            </div>
          </motion.div>
        </section>

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
            {copy.categories.map((category) => {
              const Icon = category.icon;
              return (
                <motion.div key={category.title} variants={motionList}>
                  <Card className="group h-full border-border/70 bg-white/90 transition-shadow duration-200 hover:shadow-soft">
                    <CardHeader className="flex-row items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-transform duration-200 group-hover:scale-105">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <CardTitle>{category.title}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        <section className="pb-16">
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
            {copy.resources.map((resource) => (
              <motion.div
                key={resource.name}
                variants={motionList}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
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
                          {resource.description}
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
                          <div className="text-xs uppercase tracking-wide">{copy.metadata.category}</div>
                          <div className="mt-1 font-medium text-foreground">{resource.category}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-border/60 bg-white/55 px-5 py-4 sm:px-6">
                      <span className="truncate text-sm text-muted-foreground">{resource.url}</span>
                      <Button asChild variant="outline" size="sm">
                        <a href={resource.url} target="_blank" rel="noreferrer">
                          {copy.visit}
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

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
