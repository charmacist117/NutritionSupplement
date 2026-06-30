import { readFile } from "node:fs/promises";
import { HEALTH_FOOD_CATEGORY } from "./categories.js";
import { assertNaverCredentials, fetchKeywordTrends, fetchPopularKeywords, NaverShoppingInsightError } from "./naverShoppingInsight.js";
import { fetchPopularKeywordsWithBrowser } from "./naverPopularKeywordBrowser.js";
import { saveMonthlyReport } from "./storage.js";

export function previousMonthRange(now = new Date()) {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));

  return {
    monthKey: start.toISOString().slice(0, 7),
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10)
  };
}

export function normalizeCollectionRange(input = {}) {
  const startDate = String(input.startDate || "").trim();
  const endDate = String(input.endDate || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    throw new NaverShoppingInsightError("startDate and endDate must use YYYY-MM-DD format.", 400);
  }

  if (startDate > endDate) {
    throw new NaverShoppingInsightError("startDate cannot be later than endDate.", 400);
  }

  return {
    monthKey: rangeKey(startDate, endDate),
    startDate,
    endDate
  };
}

export async function collectMonthlyNutritionKeywords(options = {}) {
  assertNaverCredentials();

  const range = options.range || previousMonthRange();
  const category = options.category || HEALTH_FOOD_CATEGORY.id;
  const popularKeywords = options.popularKeywords || await loadPopularKeywords(options.popularKeywordFile, {
    category,
    startDate: range.startDate,
    endDate: range.endDate,
    limit: options.limit || 500
  });

  validatePopularKeywords(popularKeywords, options.limit || 500);

  const topKeywords = popularKeywords.slice(0, 5).map((item) => item.keyword);
  const anchor = await chooseAnchorKeyword({ category, range, keywords: topKeywords });
  const rows = await scoreKeywordsAgainstAnchor({
    category,
    range,
    anchorKeyword: anchor.keyword,
    popularKeywords
  });

  const result = {
    collectedAt: new Date().toISOString(),
    month: range.monthKey || rangeKey(range.startDate, range.endDate),
    startDate: range.startDate,
    endDate: range.endDate,
    category,
    categoryPath: HEALTH_FOOD_CATEGORY.path,
    anchor,
    count: rows.length,
    rows
  };

  if (options.persist !== false) {
    await saveMonthlyReport(result, { outputDir: options.outputDir });
  }

  return result;
}

async function loadPopularKeywords(filePath, request) {
  if (filePath) {
    const text = await readFile(filePath, "utf8");
    const keywords = parseKeywordList(text);
    return keywords.map((keyword, index) => ({ rank: index + 1, keyword })).slice(0, request.limit);
  }

  if (process.env.VERCEL || process.env.NAVER_POPULAR_KEYWORD_SOURCE === "browser") {
    return fetchPopularKeywordsWithBrowser(request);
  }

  try {
    return await fetchPopularKeywords(request);
  } catch (error) {
    if (process.env.CHROME_EXECUTABLE_PATH) {
      return fetchPopularKeywordsWithBrowser(request);
    }
    throw error;
  }
}

async function chooseAnchorKeyword({ category, range, keywords }) {
  const result = await fetchKeywordTrends({
    category,
    keywords,
    startDate: range.startDate,
    endDate: range.endDate,
    timeUnit: "date"
  });

  const candidates = (result.results || []).map((series) => {
    const maxDailyRatio = Math.max(0, ...(series.data || []).map((point) => Number(point.ratio) || 0));
    return { keyword: series.title, maxDailyRatio };
  });

  candidates.sort((a, b) => b.maxDailyRatio - a.maxDailyRatio || keywords.indexOf(a.keyword) - keywords.indexOf(b.keyword));

  return {
    keyword: candidates[0].keyword,
    maxDailyRatio: candidates[0].maxDailyRatio,
    candidates
  };
}

async function scoreKeywordsAgainstAnchor({ category, range, anchorKeyword, popularKeywords }) {
  const byKeyword = new Map(popularKeywords.map((item) => [item.keyword, { ...item, dailyAverageRatio: null, points: [] }]));
  const comparisonTargets = popularKeywords.map((item) => item.keyword).filter((keyword) => keyword !== anchorKeyword);

  for (const batch of chunk(comparisonTargets, 4)) {
    const keywords = [anchorKeyword, ...batch];
    const result = await fetchKeywordTrends({
      category,
      keywords,
      startDate: range.startDate,
      endDate: range.endDate,
      timeUnit: "date"
    });

    for (const series of result.results || []) {
      const row = byKeyword.get(series.title);
      if (!row) continue;

      row.points = (series.data || []).map((point) => ({
        period: point.period,
        ratio: Number(point.ratio) || 0
      }));
      row.dailyAverageRatio = average(row.points.map((point) => point.ratio));
    }
  }

  const anchorRow = byKeyword.get(anchorKeyword);
  if (anchorRow && anchorRow.dailyAverageRatio === null) {
    const anchorResult = await fetchKeywordTrends({
      category,
      keywords: [anchorKeyword],
      startDate: range.startDate,
      endDate: range.endDate,
      timeUnit: "date"
    });
    const series = anchorResult.results?.[0];
    anchorRow.points = (series?.data || []).map((point) => ({ period: point.period, ratio: Number(point.ratio) || 0 }));
    anchorRow.dailyAverageRatio = average(anchorRow.points.map((point) => point.ratio));
  }

  return [...byKeyword.values()].sort((a, b) => a.rank - b.rank);
}

function validatePopularKeywords(popularKeywords, expectedLimit) {
  if (popularKeywords.length < 5) {
    throw new NaverShoppingInsightError("At least 5 popular keywords are required.", 400);
  }

  const expectedCount = Math.min(expectedLimit, 500);
  const uniqueKeywords = new Set(popularKeywords.map((item) => item.keyword));

  if (popularKeywords.length < expectedCount) {
    throw new NaverShoppingInsightError(`Only ${popularKeywords.length} of Top ${expectedCount} popular keywords were collected.`, 500);
  }

  if (uniqueKeywords.size !== popularKeywords.length) {
    throw new NaverShoppingInsightError("Popular keyword collection contains duplicates.", 500);
  }

  const invalidRank = popularKeywords.find((item, index) => item.rank !== index + 1);
  if (invalidRank) {
    throw new NaverShoppingInsightError(`Popular keyword rank sequence is invalid at rank ${invalidRank.rank}.`, 500);
  }
}

function parseKeywordList(text) {
  const parsed = tryJson(text);
  if (Array.isArray(parsed)) {
    return parsed.map((item) => typeof item === "string" ? item : item.keyword).filter(Boolean);
  }

  return text
    .split(/\r?\n/)
    .map((line) => line.split(",")[0].trim())
    .filter((line) => line && line !== "keyword");
}

function rangeKey(startDate, endDate) {
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

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

function tryJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
