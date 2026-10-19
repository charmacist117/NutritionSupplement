import { getHealthProductsIndex, saveHealthProductsIndex } from "../src/storage.js";
import { fetchHealthProductIndex, refreshHealthProductIndex } from "../src/healthProducts.js";

export const config = { maxDuration: 60 };

export default async function handler(request, response) {
  if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed" });
  if (!process.env.CRON_SECRET || request.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return response.status(401).json({ error: "Unauthorized" });
  }
  try {
    const current = await getHealthProductsIndex();
    const index = refreshHealthProductIndex(current, await fetchHealthProductIndex());
    const storage = await saveHealthProductsIndex(index);
    if (!storage.saved) return response.status(503).json({ error: "갱신된 제품 목록을 저장하지 못했습니다." });
    return response.status(200).json({ total: index.activeTotal ?? index.total, syncedAt: index.syncedAt });
  } catch (error) {
    return response.status(502).json({ error: error.message || "제품 목록 갱신에 실패했습니다." });
  }
}
