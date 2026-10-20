import { gunzipSync } from "node:zlib";
import { filterHealthProductTypes, pageHealthProducts, searchHealthProductsLive } from "./healthProducts.js";

export const CATALOG_RELEASE_URL = "https://api.github.com/repos/charmacist117/NutritionSupplement/releases/tags/product-type-catalog";
let cachedCatalog;
let checkedAt = 0;
let loading;

export function validateProductTypeCatalog(catalog) {
  if (catalog?.schemaVersion !== 1 || catalog.complete !== true || !Array.isArray(catalog.items) || !catalog.items.length
    || catalog.total !== catalog.items.length || !Number.isFinite(Date.parse(catalog.builtAt))
    || new Set(catalog.items.map((item) => item.id)).size !== catalog.total
    || catalog.items.some((item) => !/^\d{1,30}$/.test(item.id) || typeof item.name !== "string"
      || typeof item.company !== "string" || typeof item.allTypes !== "string" || item.detailError || item.typeError
      || !Number.isFinite(Date.parse(item.typesFetchedAt)))) {
    throw new Error("전체 유형 자료 검증에 실패했습니다.");
  }
  return catalog;
}

export async function loadProductTypeCatalog() {
  if (cachedCatalog && Date.now() - checkedAt < 600000) return cachedCatalog;
  if (loading) return loading;
  loading = (async () => {
    try {
      const response = await fetch(CATALOG_RELEASE_URL, { headers: { Accept: "application/vnd.github+json", "User-Agent": "NutritionSupplement" }, signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`전체 유형 자료 조회 오류 (${response.status})`);
      const release = await response.json();
      const assets = (release.assets || []).filter((asset) => /^catalog-\d+-\d+\.json\.gz$/.test(asset.name) && asset.state === "uploaded")
        .sort((a, b) => b.id - a.id);
      for (const asset of assets.slice(0, 2)) {
        try {
          const data = await fetch(asset.browser_download_url, { signal: AbortSignal.timeout(20000) });
          if (!data.ok) throw new Error(`자료 다운로드 오류 (${data.status})`);
          cachedCatalog = validateProductTypeCatalog(JSON.parse(gunzipSync(Buffer.from(await data.arrayBuffer()))));
          checkedAt = Date.now();
          return cachedCatalog;
        } catch (error) { console.error("Product type catalog asset:", error.message); }
      }
      throw new Error("완성된 전체 유형 자료가 없습니다.");
    } catch (error) {
      if (cachedCatalog) { checkedAt = Date.now(); return cachedCatalog; }
      const unavailable = new Error("전체 유형 검색 자료를 구축 중이거나 불러올 수 없습니다. 잠시 후 다시 검색해주세요.");
      unavailable.status = 503;
      throw unavailable;
    }
  })();
  try { return await loading; } finally { loading = null; }
}

export function searchProductTypeCatalog(catalog, { page = 1, query = "", target = "types", company = "", includeExport = true } = {}) {
  validateProductTypeCatalog(catalog);
  const matchedIds = filterHealthProductTypes(catalog.items, query, { includeName: target === "all" });
  const result = pageHealthProducts(catalog, [], { page, matchedIds, company, includeExport });
  return { page: result.page, pageSize: result.pageSize, total: result.total, totalPages: result.totalPages,
    items: result.items, indexedTotal: catalog.total, fetchedAt: catalog.builtAt, catalogBuiltAt: catalog.builtAt,
    sourceUrl: catalog.sourceUrl, searchBasis: target === "all" ? "제품명·품목 총 유형" : "품목 총 유형" };
}

export async function searchHealthProducts(options = {}) {
  const target = options.target || "name";
  if (target === "name") return searchHealthProductsLive(options);
  if (!["types", "ingredients", "all"].includes(target)) {
    const error = new Error("검색 대상을 확인해주세요."); error.status = 400; throw error;
  }
  // 잘못된 검색식은 자료 다운로드 전에 거절한다.
  filterHealthProductTypes([], options.query);
  return searchProductTypeCatalog(await loadProductTypeCatalog(), options);
}
