import {
  getHealthProductDetailChunk, getHealthProductsIndex, saveHealthProductDetailChunk, saveHealthProductsIndex
} from "../src/storage.js";
import {
  fetchHealthProductDetails, fetchHealthProductIndex, HEALTH_PRODUCT_CHUNK_SIZE, pageHealthProducts
} from "../src/healthProducts.js";

export const config = { maxDuration: 60 };
const BATCH_SIZE = 60;

export default async function handler(request, response) {
  try {
    if (request.method === "GET") {
      const index = await getHealthProductsIndex();
      if (!index) return response.status(404).json({ error: "저장된 건강기능식품 제품 자료가 없습니다. 전체 수집을 시작해주세요." });
      const params = { page: request.query.page, includes: request.query.includes, excludes: request.query.excludes };
      const first = pageHealthProducts(index, [], params);
      const chunkNumbers = [...new Set(first.items.filter((item) => item.index < index.detailTotal).map((item) => Math.floor(item.index / HEALTH_PRODUCT_CHUNK_SIZE)))];
      const details = (await Promise.all(chunkNumbers.map((number) => getHealthProductDetailChunk(number)))).flat();
      return response.status(200).json(pageHealthProducts(index, details, params));
    }

    if (request.method === "POST") {
      let index = request.body?.reset ? null : await getHealthProductsIndex();
      if (!index) {
        index = await fetchHealthProductIndex();
        const storage = await saveHealthProductsIndex(index);
        if (!storage.saved) return response.status(503).json({ error: "Blob 저장소가 연결되어야 제품 자료를 저장할 수 있습니다.", storage });
        return response.status(200).json(status(index));
      }
      if (index.complete) return response.status(200).json(status(index));

      const start = Number(index.nextDetailIndex || 0);
      const sourceItems = index.items.slice(start, start + BATCH_SIZE);
      const fetched = await fetchHealthProductDetails(sourceItems);
      const grouped = new Map();
      fetched.forEach((item, offset) => {
        const number = Math.floor((start + offset) / HEALTH_PRODUCT_CHUNK_SIZE);
        if (!grouped.has(number)) grouped.set(number, []);
        grouped.get(number).push(item);
      });
      for (const [number, items] of grouped) {
        const current = await getHealthProductDetailChunk(number);
        const byId = new Map(current.map((item) => [item.id, item]));
        items.forEach((item) => byId.set(item.id, item));
        const storage = await saveHealthProductDetailChunk(number, [...byId.values()]);
        if (!storage.saved) return response.status(503).json({ error: "Blob 저장소가 연결되어야 상세 자료를 저장할 수 있습니다.", storage });
      }

      index.nextDetailIndex = start + fetched.length;
      index.detailTotal = index.nextDetailIndex;
      index.complete = index.detailTotal >= index.total;
      index.updatedAt = new Date().toISOString();
      await saveHealthProductsIndex(index);
      return response.status(200).json(status(index));
    }

    return response.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return response.status(502).json({ error: error.message || "건강기능식품 제품 자료를 수집하지 못했습니다." });
  }
}

function status(index) {
  return {
    total: index.total || 0, detailTotal: index.detailTotal || 0, complete: Boolean(index.complete),
    progress: index.total ? Math.floor((index.detailTotal || 0) / index.total * 1000) / 10 : 0,
    syncedAt: index.syncedAt || null, updatedAt: index.updatedAt || null
  };
}
