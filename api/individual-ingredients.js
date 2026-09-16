import { getHealthFunctionalIngredients, saveHealthFunctionalIngredients } from "../src/storage.js";
import { pageHealthFunctionalIngredients, syncHealthFunctionalIngredients } from "../src/individualIngredients.js";

export const config = { maxDuration: 60 };

export default async function handler(request, response) {
  try {
    if (request.method === "GET") {
      const saved = await getHealthFunctionalIngredients();
      return saved
        ? response.status(200).json(pageHealthFunctionalIngredients(saved, { page: request.query.page, query: request.query.q }))
        : response.status(404).json({ error: "저장된 원료 자료가 없습니다. 전체 동기화를 실행해주세요." });
    }

    if (request.method === "POST") {
      const synced = await syncHealthFunctionalIngredients();
      const storage = await saveHealthFunctionalIngredients(synced);
      return storage.saved
        ? response.status(200).json({ ...pageHealthFunctionalIngredients(synced), storage })
        : response.status(503).json({ error: "Blob 저장소가 연결되어야 원료 자료를 저장할 수 있습니다.", storage });
    }

    return response.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return response.status(502).json({ error: error.message || "식품안전나라 원료 자료를 동기화하지 못했습니다." });
  }
}
