import assert from "node:assert/strict";
import { collectProductTypes } from "./collectProductTypes.js";
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
let attempts = 0;
const saved = [];
const rebuilt = await collectProductTypes(items, [items[0], { ...items[1], typesFetchedAt: "2000-01-01" }],
  async (batch) => saved.push(...batch), async (pending) => {
    attempts++;
    assert.ok(pending.every((item) => item.id !== "1"));
    return pending.map((item) => attempts === 1 && item.id === "3" ? { ...item, detailError: "timeout" } : { ...item, fetchedAt: now });
  });
assert.equal(attempts, 2);
assert.equal(rebuilt.length, 3);
assert.equal(saved.length, 2);
await assert.rejects(collectProductTypes(items, [], async () => {}, async (pending) => pending.map((item) => ({ ...item, detailError: "failed" }))), /3개 제품/);

const originalFetch = globalThis.fetch;
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
console.log("full product type catalog and resumable collection checks ok");
