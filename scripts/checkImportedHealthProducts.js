import assert from "node:assert/strict";
import { fetchImportedHealthProductPage } from "../src/importedHealthProducts.js";

const originalFetch = globalThis.fetch;
const originalKey = process.env.DATA_GO_KR_API_KEY;
let calls = 0;
globalThis.fetch = async () => { calls++; throw new Error("키가 포함된 원본 요청 오류"); };
delete process.env.DATA_GO_KR_API_KEY;
try {
  await assert.rejects(fetchImportedHealthProductPage("item"), { code: "IMPORT_API_KEY_MISSING" });
  await assert.rejects(fetchImportedHealthProductPage("bad"), { status: 400 });
  await assert.rejects(fetchImportedHealthProductPage("item", 0), { status: 400 });
  assert.equal(calls, 0);
  process.env.DATA_GO_KR_API_KEY = "testKey+with/slash=";
  const row = { DCL_PRDUCT_SE_CD_NM: "건강기능식품", PRDUCT_KOREAN_NM: "수입 복합 제품", ITM_NM: "비타민", IRDNT_NM: "비타민 D, 마그네슘" };
  const result = (body, code = "00") => Response.json({ header: { resultCode: code }, body });
  globalThis.fetch = async (url) => {
    const parsed = new URL(url);
    assert.equal(parsed.origin, "https://apis.data.go.kr");
    assert.equal(parsed.searchParams.get("serviceKey"), process.env.DATA_GO_KR_API_KEY);
    assert.equal(parsed.searchParams.get("dclPrductSeCdNm"), "건강기능식품");
    return result({ totalCount: "1", items: [row] });
  };
  assert.deepEqual((await fetchImportedHealthProductPage("item", 1, 5)).rows, [row]);
  process.env.DATA_GO_KR_API_KEY = "testKey%2Bwith%2Fslash%3D";
  globalThis.fetch = async (url) => {
    assert.equal(new URL(url).searchParams.get("serviceKey"), "testKey+with/slash=");
    return result({ totalCount: 1, items: [row] });
  };
  assert.equal((await fetchImportedHealthProductPage("item")).total, 1);
  globalThis.fetch = async () => result({ totalCount: 2, items: [{ item: row }, { item: row }] });
  assert.deepEqual((await fetchImportedHealthProductPage("item", 1, 2)).rows, [row, row]);
  globalThis.fetch = async () => result({ totalCount: 1, items: { item: row } });
  assert.deepEqual((await fetchImportedHealthProductPage("text", 1, 1)).rows, [row]);
  globalThis.fetch = async () => result({ totalCount: 0, items: "" });
  assert.equal((await fetchImportedHealthProductPage("text")).total, 0);
  globalThis.fetch = async () => result({ totalCount: 2, items: [row] });
  await assert.rejects(fetchImportedHealthProductPage("item"), /검증/);
  globalThis.fetch = async () => result({ totalCount: 1, items: [{ ...row, DCL_PRDUCT_SE_CD_NM: "가공식품" }] });
  await assert.rejects(fetchImportedHealthProductPage("item"), /검증/);
  globalThis.fetch = async () => result({}, "30");
  await assert.rejects(fetchImportedHealthProductPage("item"), /승인/);
  globalThis.fetch = async () => { throw new Error(process.env.DATA_GO_KR_API_KEY); };
  await assert.rejects(fetchImportedHealthProductPage("item"), (error) => !error.message.includes(process.env.DATA_GO_KR_API_KEY));
} finally {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.DATA_GO_KR_API_KEY;
  else process.env.DATA_GO_KR_API_KEY = originalKey;
}
console.log("imported health product API key isolation, paging and health-food classification checks ok");
