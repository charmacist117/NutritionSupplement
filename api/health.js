import { HEALTH_FOOD_CATEGORY } from "../src/categories.js";
import { getNaverCredentialCount } from "../src/naverShoppingInsight.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const naverCredentialCount = safeNaverCredentialCount();

  response.status(200).json({
    ok: true,
    naverConfigured: naverCredentialCount > 0,
    naverCredentialCount,
    blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    category: HEALTH_FOOD_CATEGORY
  });
}

function safeNaverCredentialCount() {
  try {
    return getNaverCredentialCount();
  } catch {
    return 0;
  }
}
