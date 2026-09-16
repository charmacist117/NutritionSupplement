import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

const MONTHLY_PREFIX = "monthly";
const SETTINGS_PREFIX = "settings";
const INGREDIENTS_PREFIX = "ingredients";
const HEALTH_PRODUCTS_PREFIX = "health-products";
const KEYWORD_CATEGORY_MAPPINGS_PATH = `${SETTINGS_PREFIX}/keyword-category-mappings.json`;
const NAVER_API_SETTINGS_PATH = `${SETTINGS_PREFIX}/naver-api-settings.json`;
const HEALTH_FUNCTIONAL_INGREDIENTS_PATH = `${INGREDIENTS_PREFIX}/health-functional-ingredients.json`;
const HEALTH_PRODUCTS_INDEX_PATH = `${HEALTH_PRODUCTS_PREFIX}/index.json`;
const BLOB_ACCESS = "private";

export async function saveMonthlyReport(result, options = {}) {
  const report = normalizeMonthlyReport(result);

  if (shouldUseBlob()) {
    const { put } = await import("@vercel/blob");
    await put(`${MONTHLY_PREFIX}/${report.month}.json`, JSON.stringify(report, null, 2), {
      access: BLOB_ACCESS,
      allowOverwrite: true,
      contentType: "application/json"
    });
    await put(`${MONTHLY_PREFIX}/${report.month}.csv`, toCsv(report.rows), {
      access: BLOB_ACCESS,
      allowOverwrite: true,
      contentType: "text/csv; charset=utf-8"
    });
    return { saved: true, storage: "blob", access: BLOB_ACCESS, key: report.month };
  }

  if (process.env.VERCEL) {
    return {
      saved: false,
      storage: "none",
      key: report.month,
      reason: "Blob credentials are not configured."
    };
  }

  const outputDir = options.outputDir || join(process.cwd(), "data", "monthly");
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, `${report.month}.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(join(outputDir, `${report.month}.csv`), toCsv(report.rows), "utf8");
  return { saved: true, storage: "file", key: report.month };
}

export async function getMonthlyReport(month, options = {}) {
  if (!isReportKey(month)) {
    throw new Error("report key must use YYYY-MM or YYYY-MM-DD_YYYY-MM-DD format.");
  }

  if (shouldUseBlob()) {
    const text = await getBlobText(`${MONTHLY_PREFIX}/${month}.json`);
    return text ? JSON.parse(text) : null;
  }

  try {
    const outputDir = options.outputDir || join(process.cwd(), "data", "monthly");
    const text = await readFile(join(outputDir, `${month}.json`), "utf8");
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function deleteMonthlyReport(month, options = {}) {
  if (!isReportKey(month)) {
    throw new Error("report key must use YYYY-MM or YYYY-MM-DD_YYYY-MM-DD format.");
  }

  const paths = [
    `${MONTHLY_PREFIX}/${month}.json`,
    `${MONTHLY_PREFIX}/${month}.csv`
  ];

  if (shouldUseBlob()) {
    const { del } = await import("@vercel/blob");
    await del(paths);
    return { deleted: true, storage: "blob", key: month };
  }

  if (process.env.VERCEL) {
    return {
      deleted: false,
      storage: "none",
      key: month,
      reason: "Blob credentials are not configured."
    };
  }

  const outputDir = options.outputDir || join(process.cwd(), "data", "monthly");
  await Promise.all([
    unlinkIfExists(join(outputDir, `${month}.json`)),
    unlinkIfExists(join(outputDir, `${month}.csv`))
  ]);

  return { deleted: true, storage: "file", key: month };
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
    const text = await getBlobText(KEYWORD_CATEGORY_MAPPINGS_PATH);
    return text ? normalizeKeywordCategoryMappings(JSON.parse(text)) : emptyKeywordCategoryMappings();
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
      access: BLOB_ACCESS,
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

export async function getNaverApiSettings(options = {}) {
  if (shouldUseBlob()) {
    const text = await getBlobText(NAVER_API_SETTINGS_PATH);
    return text ? normalizeNaverApiSettings(JSON.parse(text)) : normalizeNaverApiSettings();
  }

  try {
    const outputDir = options.outputDir || join(process.cwd(), "data", "settings");
    const text = await readFile(join(outputDir, "naver-api-settings.json"), "utf8");
    return normalizeNaverApiSettings(JSON.parse(text));
  } catch {
    return normalizeNaverApiSettings();
  }
}

export async function saveNaverApiSettings(input, options = {}) {
  const payload = { ...normalizeNaverApiSettings(input), updatedAt: new Date().toISOString() };

  if (shouldUseBlob()) {
    const { put } = await import("@vercel/blob");
    await put(NAVER_API_SETTINGS_PATH, JSON.stringify(payload, null, 2), {
      access: BLOB_ACCESS,
      allowOverwrite: true,
      contentType: "application/json"
    });
    return payload;
  }

  if (process.env.VERCEL) throw new Error("Blob 저장소가 연결되어야 활성 API 프로필을 저장할 수 있습니다.");
  const outputDir = options.outputDir || join(process.cwd(), "data", "settings");
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, "naver-api-settings.json"), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return payload;
}

export async function getHealthFunctionalIngredients(options = {}) {
  if (shouldUseBlob()) {
    const text = await getBlobText(HEALTH_FUNCTIONAL_INGREDIENTS_PATH);
    return text ? normalizeHealthFunctionalIngredients(JSON.parse(text)) : null;
  }

  try {
    const outputDir = options.outputDir || join(process.cwd(), "data", "ingredients");
    return normalizeHealthFunctionalIngredients(JSON.parse(await readFile(join(outputDir, "health-functional-ingredients.json"), "utf8")));
  } catch {
    return null;
  }
}

export async function saveHealthFunctionalIngredients(input, options = {}) {
  const payload = normalizeHealthFunctionalIngredients(input);

  if (shouldUseBlob()) {
    const { put } = await import("@vercel/blob");
    await put(HEALTH_FUNCTIONAL_INGREDIENTS_PATH, JSON.stringify(payload), {
      access: BLOB_ACCESS,
      allowOverwrite: true,
      contentType: "application/json"
    });
    return { saved: true, storage: "blob", total: payload.total };
  }

  if (process.env.VERCEL) return { saved: false, storage: "none", reason: "Blob credentials are not configured." };

  const outputDir = options.outputDir || join(process.cwd(), "data", "ingredients");
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, "health-functional-ingredients.json"), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return { saved: true, storage: "file", total: payload.total };
}

export async function getHealthProductsIndex(options = {}) {
  if (shouldUseBlob()) {
    const text = await getBlobText(HEALTH_PRODUCTS_INDEX_PATH);
    return text ? JSON.parse(text) : null;
  }
  try {
    const outputDir = options.outputDir || join(process.cwd(), "data", "health-products");
    return JSON.parse(await readFile(join(outputDir, "index.json"), "utf8"));
  } catch {
    return null;
  }
}

export async function saveHealthProductsIndex(payload, options = {}) {
  if (shouldUseBlob()) {
    const { put } = await import("@vercel/blob");
    await put(HEALTH_PRODUCTS_INDEX_PATH, JSON.stringify(payload), { access: BLOB_ACCESS, allowOverwrite: true, contentType: "application/json" });
    return { saved: true, storage: "blob" };
  }
  if (process.env.VERCEL) return { saved: false, storage: "none", reason: "Blob credentials are not configured." };
  const outputDir = options.outputDir || join(process.cwd(), "data", "health-products");
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, "index.json"), `${JSON.stringify(payload)}\n`, "utf8");
  return { saved: true, storage: "file" };
}

export async function getHealthProductDetailChunk(number, options = {}) {
  const name = `details-${String(number).padStart(4, "0")}.json`;
  if (shouldUseBlob()) {
    const text = await getBlobText(`${HEALTH_PRODUCTS_PREFIX}/${name}`);
    return text ? JSON.parse(text) : [];
  }
  try {
    const outputDir = options.outputDir || join(process.cwd(), "data", "health-products");
    return JSON.parse(await readFile(join(outputDir, name), "utf8"));
  } catch {
    return [];
  }
}

export async function saveHealthProductDetailChunk(number, items, options = {}) {
  const name = `details-${String(number).padStart(4, "0")}.json`;
  if (shouldUseBlob()) {
    const { put } = await import("@vercel/blob");
    await put(`${HEALTH_PRODUCTS_PREFIX}/${name}`, JSON.stringify(items), { access: BLOB_ACCESS, allowOverwrite: true, contentType: "application/json" });
    return { saved: true, storage: "blob" };
  }
  if (process.env.VERCEL) return { saved: false, storage: "none", reason: "Blob credentials are not configured." };
  const outputDir = options.outputDir || join(process.cwd(), "data", "health-products");
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, name), `${JSON.stringify(items)}\n`, "utf8");
  return { saved: true, storage: "file" };
}

export async function getHealthProductSearchChunk(number, options = {}) {
  const name = `search-${String(number).padStart(4, "0")}.json`;
  if (shouldUseBlob()) {
    const text = await getBlobText(`${HEALTH_PRODUCTS_PREFIX}/${name}`);
    return text ? JSON.parse(text) : [];
  }
  try {
    const outputDir = options.outputDir || join(process.cwd(), "data", "health-products");
    return JSON.parse(await readFile(join(outputDir, name), "utf8"));
  } catch {
    return [];
  }
}

export async function saveHealthProductSearchChunk(number, items, options = {}) {
  const name = `search-${String(number).padStart(4, "0")}.json`;
  if (shouldUseBlob()) {
    const { put } = await import("@vercel/blob");
    await put(`${HEALTH_PRODUCTS_PREFIX}/${name}`, JSON.stringify(items), { access: BLOB_ACCESS, allowOverwrite: true, contentType: "application/json" });
    return { saved: true, storage: "blob" };
  }
  if (process.env.VERCEL) return { saved: false, storage: "none", reason: "Blob credentials are not configured." };
  const outputDir = options.outputDir || join(process.cwd(), "data", "health-products");
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, name), `${JSON.stringify(items)}\n`, "utf8");
  return { saved: true, storage: "file" };
}

function shouldUseBlob() {
  return hasBlobCredentials();
}

export function hasBlobCredentials(env = process.env) {
  return Boolean(env.BLOB_READ_WRITE_TOKEN || (env.BLOB_STORE_ID && env.VERCEL_OIDC_TOKEN));
}

async function getBlobText(pathname) {
  const { get } = await import("@vercel/blob");
  const result = await get(pathname, { access: BLOB_ACCESS });
  if (result?.statusCode !== 200 || !result.stream) return null;

  return new Response(result.stream).text();
}

async function unlinkIfExists(path) {
  try {
    await unlink(path);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

function emptyKeywordCategoryMappings() {
  return {
    updatedAt: null,
    categories: null,
    categoryAliases: {},
    mappings: []
  };
}

function normalizeKeywordCategoryMappings(input = {}) {
  const source = Array.isArray(input) ? input : input.mappings;
  const byKeyword = new Map();
  const categories = Array.isArray(input.categories)
    ? [...new Set(input.categories.map((item) => String(item || "").trim()).filter(Boolean))]
    : null;
  const categoryAliases = {};

  if (input.categoryAliases && typeof input.categoryAliases === "object" && !Array.isArray(input.categoryAliases)) {
    for (const [from, to] of Object.entries(input.categoryAliases)) {
      const sourceCategory = String(from || "").trim();
      const targetCategory = String(to || "").trim();
      if (sourceCategory && targetCategory && sourceCategory !== targetCategory) {
        categoryAliases[sourceCategory] = targetCategory;
      }
    }
  }

  for (const item of source || []) {
    const keyword = String(item.keyword || "").trim();
    const rawCategories = Array.isArray(item.categories)
      ? item.categories
      : [item.category, item.secondaryCategory];
    const mappedCategories = [];

    for (const value of rawCategories) {
      const category = String(value || "").trim();
      if (!category || mappedCategories.some((item) => normalizeMappingKey(item) === normalizeMappingKey(category))) continue;
      mappedCategories.push(category);
      if (mappedCategories.length === 2) break;
    }
    if (!keyword || !mappedCategories.length) continue;

    byKeyword.set(normalizeMappingKey(keyword), {
      keyword,
      category: mappedCategories[0],
      ...(mappedCategories[1] ? { secondaryCategory: mappedCategories[1] } : {})
    });
  }

  return {
    updatedAt: input.updatedAt || null,
    categories,
    categoryAliases,
    mappings: [...byKeyword.values()].sort((a, b) => a.keyword.localeCompare(b.keyword, "ko"))
  };
}

function normalizeNaverApiSettings(input = {}) {
  return {
    activeProfile: String(input.activeProfile || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40),
    updatedAt: input.updatedAt || null
  };
}

function normalizeHealthFunctionalIngredients(input = {}) {
  const items = Array.isArray(input.items) ? input.items.map((item) => ({
    number: String(item.number || ""), registeredDate: String(item.registeredDate || ""), validity: String(item.validity || ""),
    ingredient: String(item.ingredient || ""), recognitionNumber: String(item.recognitionNumber || ""), company: String(item.company || ""),
    functionality: String(item.functionality || ""), dailyIntake: String(item.dailyIntake || ""), cautions: String(item.cautions || ""),
    other: String(item.other || ""), category: String(item.category || "")
  })).filter((item) => item.ingredient) : [];
  return {
    syncedAt: input.syncedAt || null,
    source: String(input.source || "식품안전나라 건강기능식품 원료별 정보"),
    sourceUrl: String(input.sourceUrl || ""),
    total: items.length,
    items
  };
}

function normalizeMappingKey(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function isReportKey(value) {
  const key = String(value || "");
  return /^\d{4}-\d{2}$/.test(key) || /^\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}$/.test(key);
}

function normalizeMonthlyReport(input = {}) {
  const startDate = String(input.startDate || "").trim();
  const endDate = String(input.endDate || "").trim();
  const month = String(input.month || rangeKey(startDate, endDate)).trim();

  if (!isReportKey(month)) {
    throw new Error("report key must use YYYY-MM or YYYY-MM-DD_YYYY-MM-DD format.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    throw new Error("report startDate and endDate must use YYYY-MM-DD format.");
  }

  if (!Array.isArray(input.rows)) {
    throw new Error("report rows must be an array.");
  }

  return {
    ...input,
    month,
    startDate,
    endDate,
    count: Number(input.count || input.rows.length),
    rows: input.rows.map((row, index) => ({
      ...row,
      rank: Number(row.rank || index + 1),
      keyword: String(row.keyword || "").trim(),
      dailyAverageRatio: Number(row.dailyAverageRatio || 0)
    })).filter((row) => row.keyword)
  };
}

function rangeKey(startDate, endDate) {
  if (!startDate || !endDate) return "";

  const monthKey = startDate.slice(0, 7);
  if (monthKey === endDate.slice(0, 7) && startDate.endsWith("-01") && endDate === lastDayOfMonth(monthKey)) {
    return monthKey;
  }

  return `${startDate}_${endDate}`;
}

function lastDayOfMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
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
