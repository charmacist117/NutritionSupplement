import { fetchHealthProductDetailLive, fetchHealthProductTypesLive, searchHealthProductsLive } from "../src/healthProducts.js";

export const config = { maxDuration: 60 };

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed" });
  try {
    const result = request.query.id !== undefined
      ? await fetchHealthProductDetailLive(request.query.id)
      : request.query.ids !== undefined ? await fetchHealthProductTypesLive(String(request.query.ids).split(","))
      : await searchHealthProductsLive({ page: request.query.page, query: String(request.query.q || "").trim(),
        target: request.query.target || "name", company: String(request.query.company || "").trim(), includeExport: request.query.includeExport !== "false" });
    return response.status(200).json(result);
  } catch (error) {
    return response.status(error.status || 502).json({ error: error.message || "식품안전나라 조회에 실패했습니다." });
  }
}
