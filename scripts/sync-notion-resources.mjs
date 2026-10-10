import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@notionhq/client";
import { computeResourceDataVersion } from "./resource-data-version.mjs";

// 与 functions/api/log.ts 的 ID_PATTERN 相同
const ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/;

const validCategories = [
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

const validCosts = ["Free", "Paid", "Mixed"];
const validStatuses = ["Active", "Archived"];

// 作为模块导入时（scripts/notion-id-check.mjs）只提供函数，不执行同步
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}

async function main() {
  const root = process.cwd();
  const resourcePath = path.join(root, "data", "resources.ts");

  await loadEnvFile(path.join(root, ".env.local"));

  const notionToken = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notionToken || !databaseId) {
    console.error("Missing NOTION_TOKEN or NOTION_DATABASE_ID in .env.local");
    process.exit(1);
  }

  const notion = new Client({ auth: notionToken });
  const rows = await fetchAllPages(notion, databaseId);
  const publishedRows = rows.filter((page) => getCheckbox(page, "Published"));
  const resources = publishedRows.map((page) => normalizePage(page));

  if (resources.length === 0) {
    throw new Error(
      `Notion sync found 0 published resources.\n` +
        `Make sure your database has a checkbox property named "Published" and at least one row is checked.`,
    );
  }

  const ids = new Set();
  const slugs = new Set();
  for (const resource of resources) {
    if (ids.has(resource.id)) {
      throw new Error(`Duplicate ID: ${resource.id}`);
    }
    if (slugs.has(resource.slug)) {
      throw new Error(`Duplicate slug: ${resource.slug}`);
    }
    ids.add(resource.id);
    slugs.add(resource.slug);
  }

  const file = renderResourceFile(resources);
  await fs.writeFile(resourcePath, file, "utf8");
  console.log(`Synced ${resources.length} resources to data/resources.ts`);
}

async function loadEnvFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex === -1) continue;
      const key = trimmed.slice(0, equalsIndex).trim();
      const value = trimmed.slice(equalsIndex + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = stripQuotes(value);
      }
    }
  } catch (error) {
    if (error && error.code === "ENOENT") return;
    throw error;
  }
}

function stripQuotes(value) {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

async function fetchAllPages(client, dbId) {
  const results = [];
  let cursor = undefined;

  try {
    do {
      const response = await client.databases.query({
        database_id: dbId,
        start_cursor: cursor,
        page_size: 100,
      });
      results.push(...response.results);
      cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);
  } catch (error) {
    if (error?.code === "object_not_found") {
      throw new Error(
        `Notion database not found or not shared with the integration.\n` +
          `Database ID: ${dbId}\n` +
          `Open your Notion database -> Share -> invite "womencareer sync" -> then run npm run sync:notion again.`,
      );
    }
    throw error;
  }

  return results;
}

// Notion 的 ID 列只在新建资源时填写一次，之后不再修改；删除资源时不复用它的 id
export function normalizePage(page) {
  const id = getText(page, "ID");
  if (!ID_PATTERN.test(id)) {
    throw new Error(
      `Notion 页面 ${page.id}（Name: ${getTitle(page, "Name")}）的 ID 列为空或格式不对：${JSON.stringify(id)}，需要符合 ${ID_PATTERN}`,
    );
  }

  const resource = {
    id,
    slug: getText(page, "Slug"),
    name: getTitle(page, "Name"),
    nameZh: getOptionalText(page, "Name ZH"),
    shortDescription: getText(page, "Short Description"),
    shortDescriptionZh: getOptionalText(page, "Short Description ZH"),
    category: getSelect(page, "Category"),
    tags: getMultiSelect(page, "Tags"),
    tagsZh: getOptionalMultiSelect(page, "Tags ZH"),
    region: getSelect(page, "Region"),
    type: getText(page, "Type"),
    typeZh: getOptionalText(page, "Type ZH"),
    language: getMultiSelect(page, "Language"),
    cost: getSelect(page, "Cost"),
    status: getSelect(page, "Status"),
    officialUrl: getUrl(page, "Official URL"),
    logoUrl: getOptionalUrl(page, "Logo URL"),
    featured: getCheckbox(page, "Featured"),
  };

  if (!resource.slug) {
    resource.slug = slugify(resource.name);
  }

  assertValue(resource.name, "Name");
  assertValue(resource.shortDescription, "Short Description");
  assertEnum(resource.category, validCategories, "Category");
  assertValue(resource.region, "Region");
  assertEnum(resource.cost, validCosts, "Cost");
  assertEnum(resource.status, validStatuses, "Status");
  assertValue(resource.type, "Type");
  assertValue(resource.officialUrl, "Official URL");

  return resource;
}

function assertValue(value, fieldName) {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    throw new Error(`Missing required value for ${fieldName}`);
  }
}

function assertEnum(value, list, fieldName) {
  if (!list.includes(value)) {
    throw new Error(`Invalid ${fieldName}: ${value}`);
  }
}

function getProperty(page, key) {
  const property = page.properties[key];
  if (!property) {
    throw new Error(`Missing Notion property: ${key}`);
  }
  return property;
}

function getOptionalProperty(page, key) {
  return page.properties[key];
}

function getTitle(page, key) {
  const property = getProperty(page, key);
  return (property.title || []).map((item) => item.plain_text).join("").trim();
}

function getText(page, key) {
  const property = getProperty(page, key);
  return (property.rich_text || []).map((item) => item.plain_text).join("").trim();
}

function getOptionalText(page, key) {
  const property = getOptionalProperty(page, key);
  return property ? (property.rich_text || []).map((item) => item.plain_text).join("").trim() : "";
}

function getSelect(page, key) {
  const property = getProperty(page, key);
  return property.select?.name?.trim() || "";
}

function getMultiSelect(page, key) {
  const property = getProperty(page, key);
  return (property.multi_select || []).map((item) => item.name.trim()).filter(Boolean);
}

function getOptionalMultiSelect(page, key) {
  const property = getOptionalProperty(page, key);
  return property ? (property.multi_select || []).map((item) => item.name.trim()).filter(Boolean) : [];
}

function getUrl(page, key) {
  const property = getProperty(page, key);
  return property.url?.trim() || "";
}

function getOptionalUrl(page, key) {
  const property = getOptionalProperty(page, key);
  return property?.url?.trim() || "";
}

function getCheckbox(page, key) {
  const property = getProperty(page, key);
  return Boolean(property.checkbox);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function jsString(value) {
  return JSON.stringify(value);
}

function renderResourceFile(resources) {
  const header = `export interface Resource {
  id: string;
  slug: string;
  name: string;
  nameZh?: string;
  shortDescription: string;
  shortDescriptionZh?: string;
  category:
    | "Community"
    | "Learning"
    | "Book"
    | "Scholarship"
    | "Fellowship"
    | "Mentorship"
    | "Conference"
    | "Tool"
    | "Podcast"
    | "Newsletter"
    | "Research"
    | "Open Source";
  tags: string[];
  tagsZh?: string[];
  region: string;
  type: string;
  typeZh?: string;
  language: string[];
  cost: "Free" | "Paid" | "Mixed";
  status: "Active" | "Archived";
  officialUrl: string;
  logoUrl?: string;
  featured: boolean;
}

export const resources: Resource[] = [
`;

  const body = resources
    .map((resource) => {
      const optionalLines = [
        resource.nameZh ? `    nameZh: ${jsString(resource.nameZh)},` : null,
        resource.shortDescriptionZh
          ? `    shortDescriptionZh: ${jsString(resource.shortDescriptionZh)},`
          : null,
        resource.tagsZh?.length ? `    tagsZh: ${JSON.stringify(resource.tagsZh)},` : null,
        resource.typeZh ? `    typeZh: ${jsString(resource.typeZh)},` : null,
        resource.logoUrl ? `    logoUrl: ${jsString(resource.logoUrl)},` : null,
      ]
        .filter(Boolean)
        .join("\n");

      return `  {
    id: ${jsString(resource.id)},
    slug: ${jsString(resource.slug)},
    name: ${jsString(resource.name)},
${optionalLines ? `${optionalLines}\n` : ""}    shortDescription: ${jsString(resource.shortDescription)},
    category: ${jsString(resource.category)},
    tags: ${JSON.stringify(resource.tags)},
    region: ${jsString(resource.region)},
    type: ${jsString(resource.type)},
    language: ${JSON.stringify(resource.language)},
    cost: ${jsString(resource.cost)},
    status: ${jsString(resource.status)},
    officialUrl: ${jsString(resource.officialUrl)},
    featured: ${resource.featured},
  }`;
    })
    .join(",\n");

  const version = computeResourceDataVersion(resources.map((resource) => resource.id));
  return `${header}${body}\n];\n\nexport const RESOURCE_DATA_VERSION = ${jsString(version)};\n`;
}
