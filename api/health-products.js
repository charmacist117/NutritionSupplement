import { fetchHealthProductDetailLive, fetchHealthProductTypesLive } from "../src/healthProducts.js";
import { searchHealthProducts } from "../src/productTypeCatalog.js";
import { fetchFoodsafetyProductDetail } from "../src/foodsafetyApi.js";

export const config = { maxDuration: 60 };

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed" });
  try {
    const result = request.query.report !== undefined ? await fetchFoodsafetyProductDetail(request.query.report)
      : request.query.id !== undefined
      ? await fetchHealthProductDetailLive(request.query.id)
      : request.query.ids !== undefined ? await fetchHealthProductTypesLive(String(request.query.ids).split(","))
      : await searchHealthProducts({ page: request.query.page, query: String(request.query.q || "").trim(),
        target: request.query.target || "name", company: String(request.query.company || "").trim(), includeExport: request.query.includeExport !== "false" });
    return response.status(200).json(result);
  } catch (error) {
    if (error.name === "TimeoutError") return response.status(504).json({ error: "원본 사이트의 응답이 지연되었습니다. 잠시 후 다시 검색해주세요." });
    return response.status(error.status || 502).json({ error: error.message || "식품안전나라 조회에 실패했습니다." });
  }
}
