import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const MONTHLY_PREFIX = "monthly";
const SETTINGS_PREFIX = "settings";
const KEYWORD_CATEGORY_MAPPINGS_PATH = `${SETTINGS_PREFIX}/keyword-category-mappings.json`;

export async function saveMonthlyReport(result, options = {}) {
  if (shouldUseBlob()) {
    const { put } = await import("@vercel/blob");
    await put(`${MONTHLY_PREFIX}/${result.month}.json`, JSON.stringify(result, null, 2), {
      access: "public",
      allowOverwrite: true,
      contentType: "application/json"
    });
    await put(`${MONTHLY_PREFIX}/${result.month}.csv`, toCsv(result.rows), {
      access: "public",
      allowOverwrite: true,
      contentType: "text/csv; charset=utf-8"
    });
    return;
  }

  if (process.env.VERCEL) {
    return;
  }

  const outputDir = options.outputDir || join(process.cwd(), "data", "monthly");
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, `${result.month}.json`), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  await writeFile(join(outputDir, `${result.month}.csv`), toCsv(result.rows), "utf8");
}

export async function getMonthlyReport(month, options = {}) {
  if (!isReportKey(month)) {
    throw new Error("report key must use YYYY-MM or YYYY-MM-DD_YYYY-MM-DD format.");
  }

  if (shouldUseBlob()) {
    const { list } = await import("@vercel/blob");
    const result = await list({ prefix: `${MONTHLY_PREFIX}/${month}.json`, limit: 1 });
    const item = result.blobs.find((blob) => blob.pathname === `${MONTHLY_PREFIX}/${month}.json`);
    if (!item) return null;

    const response = await fetch(item.url);
    return response.ok ? response.json() : null;
  }

  try {
    const outputDir = options.outputDir || join(process.cwd(), "data", "monthly");
    const text = await readFile(join(outputDir, `${month}.json`), "utf8");
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function listMonthlyReports(options = {}) {
  if (shouldUseBlob()) {
    const { list } = await import("@vercel/blob");
    const result = await list({ prefix: `${MONTHLY_PREFIX}/`, limit: 1000 });
    return result.blobs
      .map((blob) => blob.pathname.match(/^monthly\/([0-9_-]+)\.json$/)?.[1])
      .filter(isReportKey)
      .filter(Boolean)
      .sort()
      .reverse();
  }

  try {
    const outputDir = options.outputDir || join(process.cwd(), "data", "monthly");
    const files = await readdir(outputDir);
    return files
      .map((file) => file.match(/^([0-9_-]+)\.json$/)?.[1])
      .filter(isReportKey)
      .filter(Boolean)
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export async function getKeywordCategoryMappings(options = {}) {
  if (shouldUseBlob()) {
    const { list } = await import("@vercel/blob");
    const result = await list({ prefix: KEYWORD_CATEGORY_MAPPINGS_PATH, limit: 1 });
    const item = result.blobs.find((blob) => blob.pathname === KEYWORD_CATEGORY_MAPPINGS_PATH);
    if (!item) return emptyKeywordCategoryMappings();

    const response = await fetch(item.url);
    return response.ok ? normalizeKeywordCategoryMappings(await response.json()) : emptyKeywordCategoryMappings();
  }

  try {
    const outputDir = options.outputDir || join(process.cwd(), "data", "settings");
    const text = await readFile(join(outputDir, "keyword-category-mappings.json"), "utf8");
    return normalizeKeywordCategoryMappings(JSON.parse(text));
  } catch {
    return emptyKeywordCategoryMappings();
  }
}

export async function saveKeywordCategoryMappings(input, options = {}) {
  const payload = normalizeKeywordCategoryMappings(input);
  payload.updatedAt = new Date().toISOString();

  if (shouldUseBlob()) {
    const { put } = await import("@vercel/blob");
    await put(KEYWORD_CATEGORY_MAPPINGS_PATH, JSON.stringify(payload, null, 2), {
      access: "public",
      allowOverwrite: true,
      contentType: "application/json"
    });
    return payload;
  }

  if (process.env.VERCEL) {
    return payload;
  }

  const outputDir = options.outputDir || join(process.cwd(), "data", "settings");
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, "keyword-category-mappings.json"), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return payload;
}

function shouldUseBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function emptyKeywordCategoryMappings() {
  return {
    updatedAt: null,
    mappings: []
  };
}

function normalizeKeywordCategoryMappings(input = {}) {
  const source = Array.isArray(input) ? input : input.mappings;
  const byKeyword = new Map();

  for (const item of source || []) {
    const keyword = String(item.keyword || "").trim();
    const category = String(item.category || "").trim();
    if (!keyword || !category) continue;

    byKeyword.set(normalizeMappingKey(keyword), {
      keyword,
      category
    });
  }

  return {
    updatedAt: input.updatedAt || null,
    mappings: [...byKeyword.values()].sort((a, b) => a.keyword.localeCompare(b.keyword, "ko"))
  };
}

function normalizeMappingKey(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function isReportKey(value) {
  const key = String(value || "");
  return /^\d{4}-\d{2}$/.test(key) || /^\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}$/.test(key);
}

function toCsv(rows) {
  const header = ["rank", "keyword", "dailyAverageRatio"];
  const lines = rows.map((row) => [row.rank, row.keyword, row.dailyAverageRatio].map(csvCell).join(","));
  return `${header.join(",")}\n${lines.join("\n")}\n`;
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
