import { fetchIndividualIngredients } from "../src/individualIngredients.js";

export const config = { maxDuration: 60 };

export default async function handler(request, response) {
  if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed" });
  try {
    return response.status(200).json(await fetchIndividualIngredients({ page: request.query.page, query: request.query.q }));
  } catch (error) {
    return response.status(502).json({ error: error.message || "식품안전나라 자료를 불러오지 못했습니다." });
  }
}
