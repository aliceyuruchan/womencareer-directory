import {
  BookOpen,
  CalendarDays,
  Code,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Mic,
  Newspaper,
  Target,
  Telescope,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { resources, type Resource } from "@/data/resources";

export type Language = "zh" | "en";

export interface CategoryMeta {
  icon: LucideIcon;
  zh: string;
  en: string;
  zhDesc: string;
  enDesc: string;
}

export const categoryMeta: Record<Resource["category"], CategoryMeta> = {
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

export const categoryOrder: Resource["category"][] = [
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

export const ui = {
  zh: {
    headerSubtitle: "女性职场资料库",
    officialLinks: "目录",
    eyebrow: "轻量、精选、可验证的资源索引",
    title: "女性职场资料库",
    subtitle: "查找全球可信赖的职业社群、学习资源与发展机会。",
    searchLabel: "搜索资源",
    searchPlaceholder: "搜索社群、奖学金、活动、工具或职业机会",
    primaryCta: "探索职业社群",
    secondaryCta: "浏览学习资源",
    clearSearch: "清除搜索",
    noResults: "没有找到匹配资源。换个关键词试试。",
    categoryEyebrow: "按类别浏览",
    categoryTitle: "资源分类",
    allEyebrow: "完整目录",
    allTitle: "全部资源",
    metadata: { region: "地区", type: "类型", cost: "费用", language: "语言" },
    visit: "访问官网",
    count: "条",
    footer: "womenCareer.cn — 女性职业发展资源精选目录",
    disclaimer: "所有链接均指向官方来源。",
    backToTop: "返回顶部",
    overview: "目录概览",
    browseCategory: "浏览分类",
  },
  en: {
    headerSubtitle: "Women's workplace resource library",
    officialLinks: "Directory",
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
    allEyebrow: "Full directory",
    allTitle: "All resources",
    metadata: { region: "Region", type: "Type", cost: "Cost", language: "Language" },
    visit: "Visit Website",
    count: "items",
    footer: "womenCareer.cn — A curated directory of women's career resources",
    disclaimer: "All links point to official sources.",
    backToTop: "Back to top",
    overview: "Overview",
    browseCategory: "Browse category",
  },
} satisfies Record<
  Language,
  {
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
    allEyebrow: string;
    allTitle: string;
    metadata: { region: string; type: string; cost: string; language: string };
    visit: string;
    count: string;
    footer: string;
    disclaimer: string;
    backToTop: string;
    overview: string;
    browseCategory: string;
  }
>;

export const motionList = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export function categorySlug(category: Resource["category"]) {
  return category.toLowerCase().replace(/\s+/g, "-");
}

export function categoryFromSlug(slug: string): Resource["category"] | null {
  return (
    categoryOrder.find((category) => categorySlug(category) === slug) ?? null
  );
}

export function matchesQuery(resource: Resource, query: string) {
  return getQueryScore(resource, query) > 0;
}

export function getResourceCopy(resource: Resource, language: Language) {
  if (language === "zh") {
    return {
      name: resource.nameZh || resource.name,
      shortDescription: resource.shortDescriptionZh || resource.shortDescription,
      type: resource.typeZh || resource.type,
      tags: resource.tagsZh?.length ? resource.tagsZh : resource.tags,
    };
  }

  return {
    name: resource.name,
    shortDescription: resource.shortDescription,
    type: resource.type,
    tags: resource.tags,
  };
}

export function getGroupedResources(query = "") {
  const filtered = resources.filter((resource) => matchesQuery(resource, query));

  return categoryOrder
    .map((category) => ({
      category,
      meta: categoryMeta[category],
      items: filtered.filter((resource) => resource.category === category),
    }))
    .filter((group) => group.items.length > 0);
}

export function getFilteredResources(query = "") {
  const normalized = normalizeForSearch(query);

  if (!normalized) {
    return resources;
  }

  return resources
    .map((resource) => ({ resource, score: getQueryScore(resource, normalized) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.resource.name.localeCompare(right.resource.name))
    .map((entry) => entry.resource);
}

function normalizeForSearch(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[._/-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getQueryScore(resource: Resource, query: string) {
  const normalized = normalizeForSearch(query);

  if (!normalized) {
    return 1;
  }

  const baseTerms = normalized.split(/\s+/).filter(Boolean);
  const meaningfulTerms =
    baseTerms.length > 1
      ? baseTerms.filter((term) => term.length > 2 && !englishStopWords.has(term))
      : baseTerms;
  const terms = meaningfulTerms.length > 0 ? meaningfulTerms : baseTerms;

  const fields = [
    { value: resource.name, weight: 140 },
    { value: resource.nameZh, weight: 140 },
    { value: resource.shortDescription, weight: 70 },
    { value: resource.shortDescriptionZh, weight: 70 },
    { value: resource.type, weight: 54 },
    { value: resource.typeZh, weight: 54 },
    { value: resource.region, weight: 42 },
    { value: resource.officialUrl, weight: 38 },
    { value: resource.cost, weight: 24 },
    { value: resource.status, weight: 20 },
    { value: resource.tags.join(" "), weight: 64 },
    { value: (resource.tagsZh ?? []).join(" "), weight: 64 },
    { value: resource.language.join(" "), weight: 28 },
  ];

  let total = 0;

  for (const term of terms) {
    let best = 0;

    for (const field of fields) {
      const fieldScore = scoreField(field.value, term, field.weight);
      if (fieldScore > best) {
        best = fieldScore;
      }
    }

    if (best === 0) {
      return 0;
    }

    total += best;
  }

  if (terms.length > 1) {
    total += 12;
  }

  return total;
}

const englishStopWords = new Set([
  "a",
  "an",
  "and",
  "at",
  "by",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

function scoreField(value: string | undefined, query: string, weight: number) {
  if (!value) {
    return 0;
  }

  const normalizedField = normalizeForSearch(value);
  if (!normalizedField) {
    return 0;
  }

  if (normalizedField === query) {
    return weight + 28;
  }

  if (normalizedField.startsWith(query)) {
    return weight + 18;
  }

  if (normalizedField.includes(query)) {
    return weight + 10;
  }

  const compactField = normalizedField.replace(/\s+/g, "");
  const compactQuery = query.replace(/\s+/g, "");

  if (compactField.includes(compactQuery)) {
    return weight + 8;
  }

  if (fuzzyIncludes(normalizedField, query)) {
    return Math.max(12, Math.floor(weight * 0.55));
  }

  return 0;
}

function fuzzyIncludes(haystack: string, needle: string) {
  if (needle.length < 3) {
    return false;
  }

  const words = haystack.split(/\s+/).filter(Boolean);

  return words.some((word) => levenshteinWithinOne(word, needle));
}

function levenshteinWithinOne(a: string, b: string) {
  if (a === b) {
    return true;
  }

  if (Math.abs(a.length - b.length) > 1) {
    return false;
  }

  let i = 0;
  let j = 0;
  let edits = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }

    edits += 1;
    if (edits > 1) {
      return false;
    }

    if (a.length > b.length) {
      i += 1;
    } else if (a.length < b.length) {
      j += 1;
    } else {
      i += 1;
      j += 1;
    }
  }

  if (i < a.length || j < b.length) {
    edits += 1;
  }

  return edits <= 1;
}
