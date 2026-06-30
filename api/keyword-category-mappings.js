import { join } from "node:path";
import { getKeywordCategoryMappings, saveKeywordCategoryMappings } from "../src/storage.js";

export default async function handler(request, response) {
  if (request.method !== "GET" && request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const options = process.env.VERCEL ? {} : { outputDir: join(process.cwd(), "data", "settings") };

    if (request.method === "GET") {
      const mappings = await getKeywordCategoryMappings(options);
      return response.status(200).json(mappings);
    }

    const body = parseBody(request.body);
    const saved = await saveKeywordCategoryMappings(body, options);
    return response.status(200).json(saved);
  } catch (error) {
    return response.status(500).json({
      error: error.message || "Keyword category mappings request failed."
    });
  }
}

function parseBody(body) {
  if (!body) return {};
  if (typeof body === "object") return body;

  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}
