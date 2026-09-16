import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const ORIGIN = "https://www.foodsafetykorea.go.kr";
export const HEALTH_PRODUCTS_SOURCE_URL = `${ORIGIN}/portal/specialinfo/searchInfoProduct.do`;
export const HEALTH_PRODUCT_CHUNK_SIZE = 500;
export const HEALTH_PRODUCT_PAGE_SIZE = 20;

export async function fetchHealthProductIndex() {
  const session = await openSession();
  const [included, excluded] = await Promise.all([
    fetchProductList(session, "I"),
    fetchProductList(session, "E")
  ]);
  const byId = new Map();
  for (const row of [...included, ...excluded]) {
    const item = normalizeListItem(row);
    if (item.id) byId.set(item.id, item);
  }
  const items = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "ko")).map((item, index) => ({ ...item, index }));
  return {
    syncedAt: new Date().toISOString(), sourceUrl: HEALTH_PRODUCTS_SOURCE_URL,
    total: items.length, detailTotal: 0, nextDetailIndex: 0, complete: !items.length, items
  };
}

export async function fetchHealthProductDetails(items, { concurrency = 10 } = {}) {
  const session = await openSession();
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      const item = items[index];
      try {
        results[index] = { ...item, ...await fetchProductDetail(session, item) };
      } catch (error) {
        results[index] = { ...item, detailError: error.message || "상세정보 조회 실패", tables: [] };
      }
    }
  }));
  return results;
}

export function pageHealthProducts(index, details, { page = 1, includes = "", excludes = "" } = {}) {
  const includeTerms = terms(includes);
  const excludeTerms = terms(excludes);
  const filtered = (index?.items || []).filter((item) => {
    const text = searchKey([item.name, item.company, item.type, item.reportNumber].join(" "));
    return includeTerms.every((term) => text.includes(term)) && !excludeTerms.some((term) => text.includes(term));
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / HEALTH_PRODUCT_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (currentPage - 1) * HEALTH_PRODUCT_PAGE_SIZE;
  const detailMap = new Map((details || []).map((item) => [item.id, item]));
  return {
    page: currentPage, pageSize: HEALTH_PRODUCT_PAGE_SIZE, total: filtered.length, totalPages,
    items: filtered.slice(start, start + HEALTH_PRODUCT_PAGE_SIZE).map((item) => ({ ...item, detail: detailMap.get(item.id) || null })),
    indexedTotal: index?.total || 0, detailTotal: index?.detailTotal || 0,
    complete: Boolean(index?.complete), syncedAt: index?.syncedAt || null, sourceUrl: index?.sourceUrl || HEALTH_PRODUCTS_SOURCE_URL
  };
}

export function parseDetailTables(html) {
  return [...String(html || "").matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)].map((table, tableIndex) => ({
    number: tableIndex + 1,
    rows: [...table[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) =>
      [...row[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((cell) => cleanCell(cell[1]))
    ).filter((row) => row.some(Boolean))
  })).filter((table) => table.rows.length);
}

function detailFields(tables) {
  const fields = {};
  for (const { rows } of tables) {
    for (const row of rows) {
      for (let index = 0; index + 1 < row.length; index += 2) {
        const key = row[index].replace(/\s+/g, "");
        if (key && row[index + 1] && !fields[key]) fields[key] = row[index + 1];
      }
    }
  }
  return {
    address: fields["소재지"] || "",
    reportedAt: fields["일자"] || "",
    shelfLife: fields["소비기한"] || fields["유통/소비기한"] || "",
    form: fields["제품형태"] || "",
    packagingMaterial: fields["포장재질"] || "",
    packagingMethod: fields["포장방법"] || "",
    domesticExport: fields["내수/수출/겸용"] || ""
  };
}

async function openSession() {
  const response = await fetch(HEALTH_PRODUCTS_SOURCE_URL, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`식품안전나라 초기 접속 오류 (${response.status})`);
  const html = await response.text();
  const callPage = html.match(/name=["']callPage["'][^>]*value=["']([^"']+)/i)?.[1]
    || html.match(/value=["']([^"']+)["'][^>]*name=["']callPage["']/i)?.[1];
  if (!callPage) throw new Error("식품안전나라 검색 세션을 확인하지 못했습니다.");
  const setCookies = response.headers.getSetCookie?.() || [response.headers.get("set-cookie")].filter(Boolean);
  const cookies = setCookies.map((value) => value.split(";", 1)[0]).filter(Boolean);
  cookies.push(`callPage=${callPage}`);
  return { callPage, cookie: cookies.join("; ") };
}

async function fetchProductList(session, condition) {
  const body = new URLSearchParams({
    s_mode: "1", s_opt: "all", s_induty_cd: "131,132", s_prdlst_grp: "E0000000000000",
    s_prdlst_cd: "all", s_bsn_nm: "", s_prd_nm: "", s_prdlst_report_no: "",
    s_opt1: condition, s_keyword1: " ", s_opt2: "Y", s_opt3: "0", s_keyword2: "",
    s_order_by: "prdlst_nm", s_list_cnt: "50000", s_page_num: "1", s_prefix: "",
    s_halal_yn: "", s_highlow_yn: "", s_dsp_yn: "", s_child_yn: "", s_tx_id: "1",
    s_bar_cd: "", callPage: session.callPage
  });
  const response = await fetch(`${ORIGIN}/ajax/portal/specialinfo/searchPrdList_1.do`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", Cookie: session.cookie, Referer: HEALTH_PRODUCTS_SOURCE_URL, "X-Requested-With": "XMLHttpRequest" },
    body,
    signal: AbortSignal.timeout(45000)
  });
  if (!response.ok) throw new Error(`식품안전나라 제품 목록 오류 (${response.status})`);
  const payload = await response.json();
  const rows = findArray(payload);
  if (!rows) throw new Error("식품안전나라 제품 목록 형식이 변경되었습니다.");
  return rows;
}

async function fetchProductDetail(session, item) {
  const url = `${ORIGIN}/iframe/specialinfo/prdInfoDetail.do?prdlstReportLedgNo=${encodeURIComponent(item.id)}&from=searchCompany&callPage=${encodeURIComponent(session.callPage)}`;
  const response = await fetch(url, { headers: { Cookie: session.cookie, Referer: HEALTH_PRODUCTS_SOURCE_URL }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`상세정보 응답 오류 (${response.status})`);
  const tables = parseDetailTables(await response.text());
  if (!tables.length) throw new Error("상세 표를 찾지 못했습니다.");
  return { fetchedAt: new Date().toISOString(), sourceUrl: url, tables, ...detailFields(tables) };
}

function normalizeListItem(row) {
  return {
    id: String(row.PRDLST_REPORT_LEDG_NO || ""), name: String(row.PRDLST_NM || ""),
    company: String(row.BSSH_NM || ""), reportNumber: String(row.PRDLST_REPORT_NO || ""),
    type: String(row.PRDLST_CD_NM || ""), shelfLife: String(row.POG_DAYCNT || ""),
    domesticExport: String(row.PRDT_SIL_SRV || ""), categoryCode: String(row.PRDLST_CD || "")
  };
}

function findArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return null;
  for (const child of Object.values(value)) {
    const found = findArray(child);
    if (found) return found;
  }
  return null;
}

function terms(value) {
  return String(value || "").split(/[\s,]+/).map(searchKey).filter(Boolean);
}

function searchKey(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, "");
}

function cleanCell(value) {
  return decodeHtml(String(value || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ")).replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim();
}

function decodeHtml(value) {
  return value.replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;|&#034;/gi, '"').replace(/&#39;/gi, "'").replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv.includes("--self-check")) {
  const tables = parseDetailTables('<table><tr><th>제품명</th><td>테스트</td><th>소비기한</th><td>24개월</td></tr></table><table><tr><th>번호</th><th>성분 및 원료</th></tr><tr><td>1</td><td>비타민 C</td></tr></table>');
  assert.equal(tables.length, 2);
  assert.equal(tables[1].rows[1][1], "비타민 C");
  const page = pageHealthProducts({ items: [{ id: "1", name: "오메가3", company: "회사", type: "유지" }], total: 1 }, [], { includes: "오메가", excludes: "마그네슘" });
  assert.equal(page.total, 1);
  console.log("health product parser ok");
}
