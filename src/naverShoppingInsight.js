const NAVER_OPEN_API_KEYWORDS_URL = "https://openapi.naver.com/v1/datalab/shopping/category/keywords";
const NAVER_DATALAB_BASE_URL = "https://datalab.naver.com/shoppingInsight";

const allowedTimeUnits = new Set(["date", "week", "month"]);

export class NaverShoppingInsightError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = "NaverShoppingInsightError";
    this.status = status;
    this.details = details;
  }
}

export function getNaverCredentials(env = process.env) {
  return {
    clientId: env.NAVER_CLIENT_ID,
    clientSecret: env.NAVER_CLIENT_SECRET
  };
}

export function buildKeywordPayload(input) {
  const startDate = requireDate(input.startDate, "startDate");
  const endDate = requireDate(input.endDate, "endDate");
  const timeUnit = String(input.timeUnit || "date").trim();
  const category = String(input.category || "").trim();
  const keywords = normalizeKeywords(input.keywords);

  if (!allowedTimeUnits.has(timeUnit)) {
    throw new NaverShoppingInsightError("timeUnit must be date, week, or month.", 400);
  }

  if (!category) {
    throw new NaverShoppingInsightError("category is required.", 400);
  }

  const payload = {
    startDate,
    endDate,
    timeUnit,
    category,
    keyword: keywords.map((name) => ({ name, param: [name] }))
  };

  for (const field of ["device", "gender"]) {
    if (input[field]) payload[field] = input[field];
  }

  if (input.ages?.length) payload.ages = input.ages;

  return payload;
}

export async function fetchKeywordTrends(input, credentials = getNaverCredentials()) {
  if (!credentials.clientId || !credentials.clientSecret) {
    throw new NaverShoppingInsightError("Naver API credentials are missing.", 500);
  }

  const payload = buildKeywordPayload(input);
  const response = await fetch(NAVER_OPEN_API_KEYWORDS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Naver-Client-Id": credentials.clientId,
      "X-Naver-Client-Secret": credentials.clientSecret
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  const body = parseJson(text);

  if (!response.ok) {
    throw new NaverShoppingInsightError("Naver Shopping Insight request failed.", response.status, body || text);
  }

  return body;
}

export async function fetchPopularKeywordPage(input) {
  const page = Number(input.page || 1);
  const count = Number(input.count || 20);
  const body = new URLSearchParams({
    cid: String(input.category),
    timeUnit: "month",
    startDate: input.startDate,
    endDate: input.endDate,
    page: String(page),
    count: String(count)
  });

  const response = await fetch(`${NAVER_DATALAB_BASE_URL}/getCategoryKeywordRank.naver`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "Referer": `${NAVER_DATALAB_BASE_URL}/sCategory.naver?cid=${encodeURIComponent(input.category)}`,
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent": "Mozilla/5.0"
    },
    body
  });

  const text = await response.text();
  const json = parseJson(text);

  if (!response.ok || !json?.ranks) {
    throw new NaverShoppingInsightError("Naver DataLab keyword rank request failed.", response.status, text.slice(0, 500));
  }

  return json.ranks.map((item, index) => ({
    rank: (page - 1) * count + index + 1,
    keyword: item.keyword
  }));
}

export async function fetchPopularKeywords(input) {
  const pages = Math.ceil((input.limit || 500) / 20);
  const rows = [];

  for (let page = 1; page <= pages; page += 1) {
    rows.push(...await fetchPopularKeywordPage({ ...input, page, count: 20 }));
  }

  return rows.slice(0, input.limit || 500);
}

function requireDate(value, fieldName) {
  const text = String(value || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new NaverShoppingInsightError(`${fieldName} must use YYYY-MM-DD format.`, 400);
  }

  return text;
}

function normalizeKeywords(value) {
  const keywords = Array.isArray(value) ? value : String(value || "").split(",");
  const unique = [...new Set(keywords.map((item) => String(item).trim()).filter(Boolean))];

  if (!unique.length) {
    throw new NaverShoppingInsightError("At least one keyword is required.", 400);
  }

  if (unique.length > 20) {
    throw new NaverShoppingInsightError("Naver Shopping Insight accepts up to 20 keyword groups per request.", 400);
  }

  return unique;
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
