import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fetchKeywordTrends, fetchPopularKeywords, NaverShoppingInsightError } from "./naverShoppingInsight.js";

const DEFAULT_CATEGORY_ID = "50000006";

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

export async function collectMonthlyNutritionKeywords(options = {}) {
  const range = options.range || previousMonthRange();
  const category = options.category || process.env.NAVER_HEALTH_FOOD_CATEGORY_ID || DEFAULT_CATEGORY_ID;
  const popularKeywords = options.popularKeywords || await loadPopularKeywords(options.popularKeywordFile, {
    category,
    startDate: range.startDate,
    endDate: range.endDate,
    limit: options.limit || 500
  });

  if (popularKeywords.length < 5) {
    throw new NaverShoppingInsightError("At least 5 popular keywords are required.", 400);
  }

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
    month: range.monthKey,
    startDate: range.startDate,
    endDate: range.endDate,
    category,
    categoryPath: ["식품", "건강식품"],
    anchor,
    count: rows.length,
    rows
  };

  if (options.outputDir) {
    await saveMonthlyResult(options.outputDir, result);
  }

  return result;
}

export async function saveMonthlyResult(outputDir, result) {
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, `${result.month}.json`), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  await writeFile(join(outputDir, `${result.month}.csv`), toCsv(result.rows), "utf8");
}

async function loadPopularKeywords(filePath, request) {
  if (filePath) {
    const text = await readFile(filePath, "utf8");
    const keywords = parseKeywordList(text);
    return keywords.map((keyword, index) => ({ rank: index + 1, keyword })).slice(0, request.limit);
  }

  return fetchPopularKeywords(request);
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

function toCsv(rows) {
  const header = ["rank", "keyword", "dailyAverageRatio"];
  const lines = rows.map((row) => [row.rank, row.keyword, row.dailyAverageRatio].map(csvCell).join(","));
  return `${header.join(",")}\n${lines.join("\n")}\n`;
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
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
