import { join } from "node:path";
import { collectMonthlyNutritionKeywords, normalizeCollectionRange, previousMonthRange } from "../src/monthlyCollector.js";

export const config = {
  maxDuration: 300
};

export default async function handler(request, response) {
  if (request.method !== "POST" && request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const isVercelCron = String(request.headers["user-agent"] || "").includes("vercel-cron");
  const isAuthorized = request.headers.authorization === `Bearer ${process.env.CRON_SECRET}`;
  if (request.method === "GET" && process.env.CRON_SECRET && !isVercelCron && !isAuthorized) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  try {
    const body = parseBody(request.body);
    const range = request.method === "POST" && body.startDate && body.endDate
      ? normalizeCollectionRange({ startDate: body.startDate, endDate: body.endDate })
      : previousMonthRange();
    const result = await collectMonthlyNutritionKeywords({
      range,
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
