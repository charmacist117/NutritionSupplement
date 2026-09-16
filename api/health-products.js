import {
  getHealthProductDetailChunk, getHealthProductSearchChunk, getHealthProductsIndex, saveHealthProductDetailChunk, saveHealthProductSearchChunk, saveHealthProductsIndex
} from "../src/storage.js";
import {
  buildHealthProductSearchRows, fetchHealthProductDetails, fetchHealthProductIndex, filterHealthProductSearchRows, HEALTH_PRODUCT_CHUNK_SIZE, mergeHealthProductSearchRows, pageHealthProducts
} from "../src/healthProducts.js";

export const config = { maxDuration: 60 };
const BATCH_SIZE = 30;

export default async function handler(request, response) {
  try {
    if (request.method === "GET") {
      const index = await getHealthProductsIndex();
      if (!index) return response.status(404).json({ error: "저장된 건강기능식품 제품 자료가 없습니다. 전체 수집을 시작해주세요." });
      const query = String(request.query.q || "").trim();
      let searchRows = [];
      let matchedIds = null;
      if (query) {
        const chunkCount = Math.ceil(Number(index.searchIndexedThrough || 0) / HEALTH_PRODUCT_CHUNK_SIZE);
        const detailSearchRows = (await Promise.all(Array.from({ length: chunkCount }, (_, number) => getHealthProductSearchChunk(number)))).flat();
        searchRows = mergeHealthProductSearchRows(index.items, detailSearchRows);
        matchedIds = filterHealthProductSearchRows(searchRows, query);
      }
      const params = { page: request.query.page, matchedIds };
      const first = pageHealthProducts(index, [], params);
      const chunkNumbers = [...new Set(first.items.filter((item) => item.index < index.detailTotal).map((item) => Math.floor(item.index / HEALTH_PRODUCT_CHUNK_SIZE)))];
      const ingredientMap = new Map(searchRows.map((item) => [item.id, item.ingredients]));
      const details = (await Promise.all(chunkNumbers.map((number) => getHealthProductDetailChunk(number)))).flat()
        .map((item) => ({ ...item, ingredientText: item.ingredientText || ingredientMap.get(item.id) || buildHealthProductSearchRows([item])[0]?.ingredients || "" }));
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
      const indexedThrough = Number(index.searchIndexedThrough || 0);
      const detailTotal = Number(index.detailTotal || 0);
      if (indexedThrough < detailTotal) {
        const number = Math.floor(indexedThrough / HEALTH_PRODUCT_CHUNK_SIZE);
        const details = await getHealthProductDetailChunk(number);
        await saveHealthProductSearchChunk(number, buildHealthProductSearchRows(details));
        index.searchIndexedThrough = Math.min(detailTotal, (number + 1) * HEALTH_PRODUCT_CHUNK_SIZE);
        index.updatedAt = new Date().toISOString();
        await saveHealthProductsIndex(index);
        return response.status(200).json(status(index));
      }
      if (detailTotal >= index.total) return response.status(200).json(status(index));

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
        const merged = [...byId.values()];
        const storage = await saveHealthProductDetailChunk(number, merged);
        if (!storage.saved) return response.status(503).json({ error: "Blob 저장소가 연결되어야 상세 자료를 저장할 수 있습니다.", storage });
        await saveHealthProductSearchChunk(number, buildHealthProductSearchRows(merged));
      }

      index.nextDetailIndex = start + fetched.length;
      index.detailTotal = index.nextDetailIndex;
      index.searchIndexedThrough = index.detailTotal;
      index.complete = index.detailTotal >= index.total;
      index.updatedAt = new Date().toISOString();
      await saveHealthProductsIndex(index);
      return response.status(200).json(status(index));
    }

    return response.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return response.status(error.status || 502).json({ error: error.message || "건강기능식품 제품 자료를 수집하지 못했습니다." });
  }
}

function status(index) {
  const detailTotal = Number(index.detailTotal || 0);
  const searchIndexedThrough = Number(index.searchIndexedThrough || 0);
  const detailComplete = detailTotal >= Number(index.total || 0);
  return {
    total: index.total || 0, detailTotal, searchIndexedThrough, detailComplete,
    complete: detailComplete && searchIndexedThrough >= detailTotal,
    progress: index.total ? Math.floor(Math.min(detailTotal, searchIndexedThrough) / index.total * 1000) / 10 : 0,
    searchProgress: detailTotal ? Math.floor(searchIndexedThrough / detailTotal * 1000) / 10 : 100,
    syncedAt: index.syncedAt || null, updatedAt: index.updatedAt || null
  };
}
