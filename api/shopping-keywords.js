import { fetchKeywordTrends, getNaverCredentialPool, getNaverCredentialProfiles } from "../src/naverShoppingInsight.js";
import { getNaverApiSettings } from "../src/storage.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const settings = await getNaverApiSettings();
    const activeProfile = settings.activeProfile || process.env.NAVER_ACTIVE_PROFILE || getNaverCredentialProfiles()[0]?.profile || "";
    const result = await fetchKeywordTrends(request.body || {}, getNaverCredentialPool(process.env, activeProfile));
    response.status(200).json(result);
  } catch (error) {
    response.status(error.status || 500).json({
      error: error.message,
      details: error.details || null
    });
  }
}
