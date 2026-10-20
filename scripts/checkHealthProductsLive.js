import assert from "node:assert/strict";
import { fetchHealthProductDetailLive, fetchHealthProductTypesLive, searchHealthProductsLive } from "../src/healthProducts.js";
import handler from "../api/health-products.js";

const originalFetch = globalThis.fetch;
let revision = 1;
let sessions = 0;
let brokenCount = false;
let listRequests = 0;
const raw = (id, name, type) => ({ PRDLST_REPORT_LEDG_NO: String(id), PRDLST_NM: name, PRDLST_CD_NM: type, BSSH_NM: id % 2 ? "엠에스바이오텍(주)" : "엔피케이(주)", PREFIX_PRDLST_CD: "E", FOOD_HF_LS_CL_CD: id === 1 ? "001" : "002" });
globalThis.fetch = async (url, options = {}) => {
  assert.equal(new URL(url).hostname, "www.foodsafetykorea.go.kr");
  if (url.endsWith("searchInfoProduct.do")) {
    sessions++;
    return new Response('<input name="callPage" value="123">', { headers: { "set-cookie": "session=test; Path=/" } });
  }
  assert.match(options.headers.Cookie, /callPage=123/);
  if (url.includes("prdInfoDetail.do")) {
    const id = new URL(url).searchParams.get("prdlstReportLedgNo");
    if (id === "3") return new Response("upstream unavailable", { status: 503 });
    const typeRow = id === "2" ? "" : "<table><tr><th>유형</th><td>마그네슘,<br>비타민 D</td></tr></table>";
    return new Response(`${typeRow}<table><tr><th>성분 및 원료</th></tr><tr><td>원료 ${revision}</td></tr></table>`);
  }
  listRequests++;
  assert.equal(options.method, "POST");
  assert.equal(options.body.get("s_keyword1"), " ");
  const rows = options.body.get("s_opt1") === "I"
    ? Array.from({ length: 20 }, (_, i) => raw(i + 1, `비타민 제품 ${revision}-${i}`, "비타민 D"))
    : [raw(21, "마그네슘(수출용)", "마그네슘")];
  if (url.includes("searchPrdListCnt_1")) return Response.json({ totCnt: brokenCount ? null : rows.length });
  assert.ok(url.endsWith("searchPrdList_1.do"));
  return Response.json({ prdList: rows });
};

try {
  const page = await searchHealthProductsLive({ page: 2 });
  assert.equal(page.total, 21);
  assert.equal(page.items.length, 1);
  assert.equal(page.page, 2);
  revision = 2;
  const fresh = await searchHealthProductsLive({ query: '"제품 2"' });
  assert.equal(fresh.total, 20);
  assert.ok(fresh.items.every((item) => item.name.includes("제품 2")));
  assert.equal(sessions, 2);
  assert.equal((await searchHealthProductsLive({ target: "ingredients", query: "비타민 AND D" })).total, 20);
  assert.equal((await searchHealthProductsLive({ includeExport: false })).total, 20);
  assert.equal((await searchHealthProductsLive({ target: "all", query: "(비타민 OR 마그네슘) AND NOT 수출용" })).total, 20);
  const byCompany = await searchHealthProductsLive({ company: "엔피 케이" });
  assert.equal(byCompany.total, 10);
  assert.ok(byCompany.items.every((item) => item.company === "엔피케이(주)"));
  assert.equal((await searchHealthProductsLive({ query: "비타민", company: "엔피케이" })).total, 10);
  assert.equal((await searchHealthProductsLive({ query: "마그네슘", company: "엔피케이" })).total, 0);
  const beforeInvalid = sessions;
  await assert.rejects(searchHealthProductsLive({ query: "비타민 AND" }), { status: 400 });
  await assert.rejects(searchHealthProductsLive({ target: "bad" }), { status: 400 });
  await assert.rejects(fetchHealthProductDetailLive("../bad"), { status: 400 });
  await assert.rejects(fetchHealthProductTypesLive([]), { status: 400 });
  await assert.rejects(fetchHealthProductTypesLive(Array(21).fill("1")), { status: 400 });
  await assert.rejects(fetchHealthProductTypesLive(["../bad"]), { status: 400 });
  assert.equal(sessions, beforeInvalid);
  assert.equal((await fetchHealthProductDetailLive("1")).ingredientText, "원료 2");
  revision = 3;
  assert.equal((await fetchHealthProductDetailLive("1")).ingredientText, "원료 3");
  const listsBeforeTypes = listRequests;
  const types = await fetchHealthProductTypesLive(["1", "2", "3"]);
  assert.deepEqual(types.items[0], { id: "1", allTypes: "마그네슘,\n비타민 D", typeError: "" });
  assert.deepEqual(types.items[1], { id: "2", allTypes: "", typeError: "" });
  assert.equal(types.items[2].allTypes, "");
  assert.match(types.items[2].typeError, /503/);
  assert.equal(listRequests, listsBeforeTypes);
  brokenCount = true;
  await assert.rejects(searchHealthProductsLive(), /전체 건수/);
  brokenCount = false;
  const response = {
    headers: {}, setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; }
  };
  await handler({ method: "GET", query: {} }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["Cache-Control"], "no-store");
  assert.equal(response.data.total, 21);
  await handler({ method: "GET", query: { company: "엔피케이" } }, response);
  assert.equal(response.data.total, 10);
  await handler({ method: "GET", query: { ids: "1,2" } }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.data.items[0].allTypes, "마그네슘,\n비타민 D");
  assert.equal(response.data.items[1].allTypes, "");
  await handler({ method: "GET", query: { id: "bad" } }, response);
  assert.equal(response.statusCode, 400);
  await handler({ method: "POST" }, response);
  assert.equal(response.statusCode, 405);
  console.log("live health product search and detail checks ok");
} finally {
  globalThis.fetch = originalFetch;
}
