import { join } from "node:path";
import { collectMonthlyNutritionKeywords, previousMonthRange } from "../src/monthlyCollector.js";

export const config = {
  maxDuration: 300
};

export default async function handler(request, response) {
  if (request.method !== "POST" && request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const isVercelCron = String(request.headers["user-agent"] || "").includes("vercel-cron");
  const isAuthorized = request.headers.authorization === `Bearer ${process.env.CRON_SECRET}`;
  if (process.env.CRON_SECRET && !isVercelCron && !isAuthorized) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await collectMonthlyNutritionKeywords({
      range: previousMonthRange(),
      outputDir: process.env.VERCEL ? undefined : join(process.cwd(), "data", "monthly")
    });

    response.status(200).json({
      ok: true,
      month: result.month,
      category: result.category,
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
