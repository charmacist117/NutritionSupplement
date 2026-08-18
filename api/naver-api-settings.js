import { getNaverCredentialProfiles } from "../src/naverShoppingInsight.js";
import { getNaverApiSettings, saveNaverApiSettings } from "../src/storage.js";

export default async function handler(request, response) {
  if (!["GET", "PUT"].includes(request.method)) return response.status(405).json({ error: "Method not allowed" });

  try {
    const profiles = getNaverCredentialProfiles();
    let settings = await getNaverApiSettings();

    if (request.method === "PUT") {
      const activeProfile = String(request.body?.activeProfile || "").trim().toLowerCase();
      if (!profiles.some((item) => item.profile === activeProfile)) {
        return response.status(400).json({ error: "등록되지 않은 네이버 API 프로필입니다." });
      }
      settings = await saveNaverApiSettings({ activeProfile });
    }

    const preferredProfile = settings.activeProfile || String(process.env.NAVER_ACTIVE_PROFILE || "").trim().toLowerCase();
    const activeProfile = profiles.some((item) => item.profile === preferredProfile)
      ? preferredProfile
      : profiles[0]?.profile || "";
    response.status(200).json({
      activeProfile,
      updatedAt: settings.updatedAt,
      profiles,
      secretStorage: "vercel-environment-variables"
    });
  } catch (error) {
    response.status(500).json({ error: error.message || "네이버 API 설정을 불러오지 못했습니다." });
  }
}
