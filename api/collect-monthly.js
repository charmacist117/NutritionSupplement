import { join } from "node:path";
import { collectMonthlyNutritionKeywords, normalizeCollectionRange, previousMonthRange } from "../src/monthlyCollector.js";
import { getNaverCredentialPool, getNaverCredentialProfiles } from "../src/naverShoppingInsight.js";
import { getNaverApiSettings } from "../src/storage.js";
import { requireAdmin, requireCron } from "../src/adminAuth.js";

export const config = {
  maxDuration: 300
};

export default async function handler(request, response) {
  if (request.method !== "POST" && request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (request.method === "GET") requireCron(request);
    else requireAdmin(request);
    const body = parseBody(request.body);
    const range = request.method === "POST" && body.startDate && body.endDate
      ? normalizeCollectionRange({ startDate: body.startDate, endDate: body.endDate })
      : previousMonthRange();
    const settings = await getNaverApiSettings();
    const activeProfile = settings.activeProfile || process.env.NAVER_ACTIVE_PROFILE || getNaverCredentialProfiles()[0]?.profile || "";
    const result = await collectMonthlyNutritionKeywords({
      range,
      credentials: getNaverCredentialPool(process.env, activeProfile),
      outputDir: process.env.VERCEL ? undefined : join(process.cwd(), "data", "monthly")
    });

    response.status(200).json({
      ok: true,
      month: result.month,
      startDate: result.startDate,
      endDate: result.endDate,
      category: result.category,
      categoryPath: result.categoryPath,
      anchor: result.anchor,
      count: result.count,
      saved: result.saved,
      storage: result.storage,
      rows: result.rows
    });
  } catch (error) {
    response.status(error.status || 500).json({
      ok: false,
      error: error.message,
      details: error.details || null
    });
  }
}

function parseBody(body) {
  if (!body) return {};
  if (typeof body === "object") return body;

  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}
