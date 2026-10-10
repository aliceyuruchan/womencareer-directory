import { resources, type Resource } from "@/data/resources";

// 搜索相关的纯数据与纯函数：浏览器、Pages Function、Node 脚本共用，不引入任何 UI 依赖。

export type Language = "zh" | "en";

export interface CategoryLabel {
  zh: string;
  en: string;
  zhDesc: string;
  enDesc: string;
}

export const categoryLabels: Record<Resource["category"], CategoryLabel> = {
  Community: {
    zh: "社群",
    en: "Community",
    zhDesc: "职业网络、同行组织与互助小组。",
    enDesc: "Professional networks and peer groups.",
  },
  Learning: {
    zh: "学习",
    en: "Learning",
    zhDesc: "课程、训练营与技能提升资源。",
    enDesc: "Courses, training, and skill builders.",
  },
  Book: {
    zh: "书籍",
    en: "Books",
    zhDesc: "关于成长、领导力与职业路径的精选阅读。",
    enDesc: "Recommended reading for growth and leadership.",
  },
  Scholarship: {
    zh: "奖学金",
    en: "Scholarships",
    zhDesc: "支持教育、转型与职业机会的资助项目。",
    enDesc: "Funding for education and career access.",
  },
  Fellowship: {
    zh: "奖助项目",
    en: "Fellowships",
    zhDesc: "提供实践、曝光与支持的结构化项目。",
    enDesc: "Structured programs for experience and exposure.",
  },
  Mentorship: {
    zh: "导师制",
    en: "Mentorship",
    zhDesc: "导师、赞助人与职业指导资源。",
    enDesc: "Mentors, sponsors, and guided support.",
  },
  Conference: {
    zh: "会议",
    en: "Conferences",
    zhDesc: "会议、峰会、工作坊与线下聚会。",
    enDesc: "Conferences, summits, and meetups.",
  },
  Tool: {
    zh: "工具",
    en: "Tools",
    zhDesc: "求职、规划与职业管理工具。",
    enDesc: "Career planning and job search utilities.",
  },
  Podcast: {
    zh: "播客",
    en: "Podcasts",
    zhDesc: "职业故事、访谈与行业观察。",
    enDesc: "Audio interviews and career stories.",
  },
  Newsletter: {
    zh: "通讯",
    en: "Newsletters",
    zhDesc: "精选职业资讯与行业洞察。",
    enDesc: "Curated career news and industry insights.",
  },
  Research: {
    zh: "研究",
    en: "Research",
    zhDesc: "关于女性职场与机会差距的报告。",
    enDesc: "Reports and evidence on women at work.",
  },
  "Open Source": {
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

export const localizedTypeMap: Partial<Record<Resource["type"], string>> = {
  "AI Assistant": "AI 助手",
  Book: "书籍",
  "Certificate Program": "认证项目",
  "Community Network": "社群网络",
  "Community Organization": "社区组织",
  Conference: "会议",
  "Course Provider": "课程平台",
  "Curated List": "精选清单",
  "Design Tool": "设计工具",
  "Developer Platform": "开发者平台",
  "Fellowship Program": "奖助项目",
  Foundation: "基金会",
  "Hiring Platform": "招聘平台",
  "Job Search Tool": "求职工具",
  Jobs: "招聘平台",
  "Learning Platform": "学习平台",
  "Learning Resource": "学习资源",
  "Mentorship Platform": "导师平台",
  "Mentorship Program": "导师项目",
  Newsletter: "通讯",
  "Nonprofit Organization": "非盈利组织",
  "Open Courseware": "开放课程",
  "Open Source Curriculum": "开源课程",
  "Open Source Project": "开源项目",
  Podcast: "播客",
  "Private Network": "私享社群",
  "Productivity Tool": "效率工具",
  "Professional Association": "专业协会",
  "Professional Network": "专业人脉",
  "Professional Society": "专业社区",
  "Research Report": "研究报告",
  "Scholarship Program": "奖学金项目",
  "Venture Fund": "风险基金",
  "Writing Tool": "写作工具",
};

export const localizedRegionMap: Record<string, string> = {
  Asia: "亚洲",
  China: "中国",
  Europe: "欧洲",
  Global: "全球",
  "North America": "北美",
};

export const localizedCostMap: Record<Resource["cost"], string> = {
  Free: "免费",
  Mixed: "部分免费",
  Paid: "付费",
};

export const localizedLanguageMap: Record<string, string> = {
  Chinese: "中文",
  English: "英文",
  Multiple: "多语言",
};

export function getLocalizedType(resource: Resource, language: Language) {
  if (language === "en") {
    return resource.type;
  }

  return resource.typeZh || localizedTypeMap[resource.type] || resource.type;
}

// ---- 浏览器内的字面匹配 ----

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

export function normalizeForSearch(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[._/-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getQueryScore(resource: Resource, query: string) {
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

// ---- 语义搜索结果与字面结果的合并 ----

export interface SemanticHit {
  id: string;
  score: number;
}

export interface MergeOptions {
  // 余弦相似度低于这个值的语义命中丢弃；乱码、数字这类查询的最高分在 0.41～0.43
  minScore: number;
  // 语义命中的分数低于最高分的这个比例就丢弃；相关与无关的绝对分数挤在一起，按相对值裁剪
  relativeThreshold: number;
  // 字面结果之外最多追加的语义命中条数
  maxExtra: number;
}

// 评测（search-eval/queries.json，65 条查询）选出的参数：Recall@10 0.83、零结果 0、平均列表 7 条
export const SEMANTIC_MERGE_OPTIONS: MergeOptions = { minScore: 0.45, relativeThreshold: 0.85, maxExtra: 12 };

const resourceById = new Map(resources.map((resource) => [resource.id, resource]));

export function mergeSearchResults(
  localResults: Resource[],
  semanticHits: SemanticHit[],
  options: MergeOptions = SEMANTIC_MERGE_OPTIONS,
): Resource[] {
  const seen = new Set(localResults.map((resource) => resource.id));
  // 截断线只用页面存在的资源计算：索引里残留的已删除资源不能抬高截断线
  const sorted = semanticHits.filter((hit) => resourceById.has(hit.id)).sort((left, right) => right.score - left.score);
  const cutoff = Math.max(options.minScore, (sorted[0]?.score ?? 0) * options.relativeThreshold);
  const extra: Resource[] = [];

  for (const hit of sorted) {
    if (hit.score < cutoff || extra.length >= options.maxExtra) {
      break;
    }
    if (seen.has(hit.id)) {
      continue;
    }
    seen.add(hit.id);
    extra.push(resourceById.get(hit.id)!);
  }

  return [...localResults, ...extra];
}

// 语义命中里页面数据中不存在的 id，写入搜索日志的 semantic_unknown_ids
export function unknownSemanticIds(semanticHits: SemanticHit[]): string[] {
  return semanticHits.filter((hit) => !resourceById.has(hit.id)).map((hit) => hit.id);
}

// ---- AI Search 索引文档 ----

export const SEARCH_DOCUMENT_VERSION = "2026-09-18-v1";
export const SEARCH_DOCUMENT_PREFIX = "resources/";

export function searchDocumentKey(resource: Resource) {
  return `${SEARCH_DOCUMENT_PREFIX}${resource.id}.md`;
}

export function buildSearchDocument(resource: Resource) {
  const category = categoryLabels[resource.category];
  const typeZh = resource.typeZh || localizedTypeMap[resource.type] || "";
  const tags = [...resource.tags, ...(resource.tagsZh ?? [])];
  const languages = resource.language.map(
    (item) => `${item} / ${localizedLanguageMap[item] || item}`,
  );

  const lines = [
    `# ${resource.name}${resource.nameZh ? ` / ${resource.nameZh}` : ""}`,
    "",
    `分类 Category: ${category.en} / ${category.zh}`,
    `类型 Type: ${resource.type}${typeZh ? ` / ${typeZh}` : ""}`,
    `标签 Tags: ${tags.join(", ")}`,
    `地区 Region: ${resource.region} / ${localizedRegionMap[resource.region] || resource.region}`,
    `费用 Cost: ${resource.cost} / ${localizedCostMap[resource.cost]}`,
    `语言 Language: ${languages.join(", ")}`,
    "",
    resource.shortDescription.trim(),
    "",
    (resource.shortDescriptionZh ?? "").trim(),
  ];

  return `${lines.join("\n").trim()}\n`;
}

export function buildSearchMetadata(resource: Resource): Record<string, string> {
  return {
    resourceid: resource.id,
    category: resource.category,
    region: resource.region,
    cost: resource.cost,
    status: resource.status,
  };
}

export const SEARCH_METADATA_SCHEMA = [
  { field_name: "resourceid", data_type: "text" },
  { field_name: "category", data_type: "text" },
  { field_name: "region", data_type: "text" },
  { field_name: "cost", data_type: "text" },
  { field_name: "status", data_type: "text" },
] as const;
