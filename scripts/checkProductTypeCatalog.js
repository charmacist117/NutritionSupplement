import assert from "node:assert/strict";
import { collectProductTypeCatalog } from "./collectProductTypes.js";
import { fetchFoodsafetyApiPage, normalizeFoodsafetyProduct, fetchFoodsafetyProductDetail } from "../src/foodsafetyApi.js";
import { validateProductTypeCatalog, searchProductTypeCatalog, searchHealthProducts, loadProductTypeCatalog } from "../src/productTypeCatalog.js";
import { gzipSync } from "node:zlib";
import handler from "../api/health-products.js";

const now = new Date().toISOString();
const items = [
  { id: "1", name: "더파르마 마그네슘락테이트 플러스디정", company: "코스맥스엔비티(주)", type: "마그네슘", allTypes: "마그네슘, 비타민 D", typesFetchedAt: now },
  { id: "2", name: "단일 비타민(수출용)", company: "다른 업체", type: "비타민 D", allTypes: "비타민 D", typesFetchedAt: now },
  { id: "3", name: "복합제", company: "코스맥스엔비티(주)", type: "비타민 C", allTypes: "비타민 C, 마그네슘, 비타민 D", typesFetchedAt: now }
];
const catalog = { schemaVersion: 1, complete: true, total: items.length, builtAt: now, items };
assert.equal(validateProductTypeCatalog(catalog), catalog);
for (const broken of [{ ...catalog, complete: false }, { ...catalog, total: 4 }, { ...catalog, items: [items[0], items[0], items[2]] },
  { ...catalog, items: items.map((item, i) => i ? item : { ...item, allTypes: undefined }) }]) {
  assert.throws(() => validateProductTypeCatalog(broken));
}
assert.deepEqual(searchProductTypeCatalog(catalog, { query: "마그네슘 AND 비타민D" }).items.map((item) => item.id), ["1", "3"]);
assert.equal(searchProductTypeCatalog(catalog, { query: "NOT 마그네슘" }).total, 1);
assert.equal(searchProductTypeCatalog(catalog, { query: "NOT 마그네슘", includeExport: false }).total, 0);
assert.equal(searchProductTypeCatalog(catalog, { query: "비타민D", company: "코스맥스 엔비티" }).total, 2);
assert.equal(searchProductTypeCatalog(catalog, { query: "더파르마 AND 비타민D", target: "all" }).total, 1);
assert.throws(() => searchProductTypeCatalog(catalog, { query: "AND" }), { status: 400 });
const raw = (id) => ({ PRDLST_REPORT_NO: String(id), PRDLST_NM: `제품 ${id}`, BSSH_NM: "코스맥스엔비티(주)",
  PRDLST_CDNM: "마그네슘", RAWMTRL_NM: "마그네슘, 비타민 D" });
const calls = [];
const rebuilt = await collectProductTypeCatalog(async (start, end) => {
  calls.push([start, end]);
  return { total: 1001, rows: Array.from({ length: Math.min(end, 1001) - start + 1 }, (_, i) => raw(start + i)) };
}, async () => {});
assert.deepEqual(calls, [[1, 1000], [1001, 1001]]);
assert.equal(rebuilt.total, 1001);
assert.equal(rebuilt.items[0].detailLookup, "report");
assert.equal(rebuilt.items[0].allTypes, "마그네슘, 비타민 D");
await assert.rejects(collectProductTypeCatalog(async () => ({ total: 0, rows: [] })), /비어/);
await assert.rejects(collectProductTypeCatalog(async () => ({ total: 2, rows: [raw(1)] })), /누락/);
await assert.rejects(collectProductTypeCatalog(async () => ({ total: 2, rows: [raw(1), raw(1)] })), /검증/);
assert.throws(() => normalizeFoodsafetyProduct({ ...raw(1), RAWMTRL_NM: undefined }, now), /전체 유형/);
assert.equal(normalizeFoodsafetyProduct({ ...raw(1), RAWMTRL_NM: null }, now).allTypes, "");

const originalFetch = globalThis.fetch;
const originalKey = process.env.FOODSAFETY_API_KEY;
delete process.env.FOODSAFETY_API_KEY;
let apiCalls = 0;
globalThis.fetch = async () => { apiCalls++; throw new Error("인증키 없이 요청하면 안 됨"); };
await assert.rejects(fetchFoodsafetyApiPage(1, 1000), { status: 503 });
await assert.rejects(fetchFoodsafetyProductDetail("bad"), { status: 400 });
assert.equal(apiCalls, 0);
process.env.FOODSAFETY_API_KEY = "unitTestKey12345";
globalThis.fetch = async (url) => {
  assert.equal(new URL(url).hostname, "openapi.foodsafetykorea.go.kr");
  return Response.json({ I0030: { total_count: "1", RESULT: { CODE: "INFO-000" }, row: [raw(1)] } });
};
assert.equal((await fetchFoodsafetyApiPage(1, 1000)).total, 1);
assert.equal((await fetchFoodsafetyProductDetail("1")).allTypes, "마그네슘, 비타민 D");
const apiResponse = { setHeader() {}, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } };
await handler({ method: "GET", query: { report: "1" } }, apiResponse);
assert.equal(apiResponse.statusCode, 200);
assert.deepEqual(apiResponse.data.tables[0].rows.find((row) => row[0] === "유형"), ["유형", "마그네슘, 비타민 D"]);
globalThis.fetch = async () => Response.json({ RESULT: { CODE: "INFO-100", MSG: "인증키 오류" } });
await assert.rejects(fetchFoodsafetyApiPage(1, 1000), /INFO-100/);
if (originalKey === undefined) delete process.env.FOODSAFETY_API_KEY; else process.env.FOODSAFETY_API_KEY = originalKey;
let requests = 0;
let unavailable = true;
globalThis.fetch = async (url) => {
  requests++;
  if (unavailable) return new Response("not ready", { status: 404 });
  if (String(url).includes("api.github.com")) return Response.json({ assets: [
    { id: 2, state: "uploaded", name: "catalog-2-1.json.gz", browser_download_url: "https://github.com/broken.gz" },
    { id: 1, state: "uploaded", name: "catalog-1-1.json.gz", browser_download_url: "https://github.com/catalog.gz" }
  ] });
  if (String(url).includes("broken")) return new Response("invalid");
  return new Response(gzipSync(JSON.stringify(catalog)));
};
try {
  await assert.rejects(searchHealthProducts({ target: "bad" }), { status: 400 });
  await assert.rejects(searchHealthProducts({ target: "types", query: "AND" }), { status: 400 });
  assert.equal(requests, 0);
  await assert.rejects(loadProductTypeCatalog(), { status: 503 });
  unavailable = false;
  assert.equal((await searchHealthProducts({ target: "types", query: "마그네슘 AND 비타민D" })).total, 2);
  assert.equal((await searchHealthProducts({ target: "ingredients", query: "비타민D" })).total, 3);
  assert.equal((await loadProductTypeCatalog()).total, 3);
  assert.equal(requests, 4);
  const response = { setHeader() {}, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } };
  await handler({ method: "GET", query: { target: "types", q: "마그네슘 AND 비타민D", company: "코스맥스" } }, response);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.data.items.map((item) => item.id), ["1", "3"]);
} finally { globalThis.fetch = originalFetch; }
console.log("full product type catalog and official API collection checks ok");
