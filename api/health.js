import { HEALTH_FOOD_CATEGORY } from "../src/categories.js";
import { getNaverCredentialCount, getNaverCredentialPool, getNaverCredentialProfiles } from "../src/naverShoppingInsight.js";
import { getNaverApiSettings, hasBlobCredentials } from "../src/storage.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const naverCredentialCount = safeNaverCredentialCount();
  const profiles = safeNaverCredentialProfiles();
  const settings = await getNaverApiSettings();
  const preferredProfile = settings.activeProfile || String(process.env.NAVER_ACTIVE_PROFILE || "").trim().toLowerCase();
  const activeProfile = profiles.some((item) => item.profile === preferredProfile)
    ? preferredProfile
    : profiles[0]?.profile || "";

  response.status(200).json({
    ok: true,
    naverConfigured: naverCredentialCount > 0,
    naverCredentialCount,
    naverActiveProfile: activeProfile,
    naverActiveProfileLabel: profiles.find((item) => item.profile === activeProfile)?.label || "",
    naverActiveCredentialCount: getNaverCredentialPool(process.env, activeProfile).length,
    blobConfigured: hasBlobCredentials(),
    category: HEALTH_FOOD_CATEGORY
  });
}

function safeNaverCredentialProfiles() {
  try {
    return getNaverCredentialProfiles();
  } catch {
    return [];
  }
}

function safeNaverCredentialCount() {
  try {
    return getNaverCredentialCount();
  } catch {
    return 0;
  }
}
