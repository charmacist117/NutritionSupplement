import { HEALTH_FOOD_CATEGORY } from "../src/categories.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  response.status(200).json({
    ok: true,
    naverConfigured: Boolean(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET),
    blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    category: HEALTH_FOOD_CATEGORY
  });
}
