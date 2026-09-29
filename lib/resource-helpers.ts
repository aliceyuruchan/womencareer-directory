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
import {
  categoryLabels,
  categoryOrder,
  getFilteredResources,
  getLocalizedType,
  getQueryScore,
  localizedCostMap,
  localizedLanguageMap,
  localizedRegionMap,
  type CategoryLabel,
  type Language,
} from "@/lib/resource-search";

export type { Language } from "@/lib/resource-search";
export { categoryOrder, getFilteredResources, getLocalizedType } from "@/lib/resource-search";

export const submitResourceConfig = {
  zh: {
    formId: "dWokyz",
    url: "#tally-open=dWokyz&tally-emoji-text=%F0%9F%91%8B&tally-emoji-animation=wave&tally-auto-close=1000",
    label: "申请入驻",
  },
  en: {
    formId: "PdNGyV",
    url: "#tally-open=PdNGyV&tally-emoji-text=%F0%9F%91%8B&tally-emoji-animation=wave&tally-auto-close=1000",
    label: "Submit a resource",
  },
} as const;

export interface CategoryMeta extends CategoryLabel {
  icon: LucideIcon;
}

const categoryIcons: Record<Resource["category"], LucideIcon> = {
  Community: Users,
  Learning: GraduationCap,
  Book: BookOpen,
  Scholarship: Landmark,
  Fellowship: Target,
  Mentorship: HeartHandshake,
  Conference: CalendarDays,
  Tool: Workflow,
  Podcast: Mic,
  Newsletter: Newspaper,
  Research: Telescope,
  "Open Source": Code,
};

export const categoryMeta = Object.fromEntries(
  categoryOrder.map((category) => [
    category,
    { icon: categoryIcons[category], ...categoryLabels[category] },
  ]),
) as Record<Resource["category"], CategoryMeta>;

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
    footer: "womencareer.cn — 女性职业发展资源精选目录",
    disclaimerTitle: "免责声明",
    disclaimer:
      "本文内容基于网上官方信息，并借助 AI 整理，旨在进行公益分享。申请者需仔细阅读官方条款，并自行承担相关决策责任。如希望举报或下架任何资源，请发送邮件至：",
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
    footer: "womencareer.cn — A curated directory of women's career resources",
    disclaimerTitle: "Disclaimer",
    disclaimer:
      "Content is based on official information available online and organized with the help of AI for public-interest sharing. Applicants should carefully review official terms and make decisions at their own responsibility. To report or request removal of any resource, email:",
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
    disclaimerTitle: string;
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
      type: getLocalizedType(resource, language),
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

export function getLocalizedMetadata(resource: Resource, language: Language) {
  return {
    region: getLocalizedRegion(resource.region, language),
    cost: getLocalizedCost(resource.cost, language),
    language: resource.language.map((item) => getLocalizedResourceLanguage(item, language)),
  };
}

export function getLocalizedRegion(region: string, language: Language) {
  if (language === "en") {
    return region;
  }

  return localizedRegionMap[region] || region;
}

export function getLocalizedCost(cost: Resource["cost"], language: Language) {
  if (language === "en") {
    return cost;
  }

  return localizedCostMap[cost] || cost;
}

export function getLocalizedResourceLanguage(value: string, language: Language) {
  if (language === "en") {
    return value;
  }

  return localizedLanguageMap[value] || value;
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
