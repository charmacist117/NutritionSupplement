import { fetchKeywordTrends, getNaverCredentials } from "../src/naverShoppingInsight.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const result = await fetchKeywordTrends(request.body || {}, getNaverCredentials());
    response.status(200).json(result);
  } catch (error) {
    response.status(error.status || 500).json({
      error: error.message,
      details: error.details || null
    });
  }
}
