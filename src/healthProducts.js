import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const ORIGIN = "https://www.foodsafetykorea.go.kr";
export const HEALTH_PRODUCTS_SOURCE_URL = `${ORIGIN}/portal/specialinfo/searchInfoProduct.do`;
export const HEALTH_PRODUCT_CHUNK_SIZE = 500;
export const HEALTH_PRODUCT_PAGE_SIZE = 20;

export async function searchHealthProductsLive({ page = 1, query = "", target = "name", company = "", includeExport = true } = {}) {
  if (!["name", "ingredients", "all"].includes(target)) {
    const error = new Error("검색 대상을 확인해주세요.");
    error.status = 400;
    throw error;
  }
  const expression = parseBooleanQuery(query);
  const keywords = target === "name" ? sourceSearchKeywords(expression) : null;
  const companyKeyword = String(company).match(/[가-힣]/)?.[0];
  const index = await fetchHealthProductIndex({ keywords: keywords && keywords.length <= 4 ? keywords : companyKeyword ? [companyKeyword] : null });
  const matchedIds = query ? filterHealthProducts(index.items, [], query, target) : null;
  const result = pageHealthProducts(index, [], { page, matchedIds, company, includeExport });
  return {
    page: result.page, pageSize: result.pageSize, total: result.total, totalPages: result.totalPages,
    items: result.items, indexedTotal: index.total, fetchedAt: index.syncedAt,
    sourceUrl: index.sourceUrl, searchBasis: target === "name" ? "제품명" : target === "all" ? "제품명·품목유형" : "품목유형"
  };
}

function sourceSearchKeywords(node) {
  if (!node || node.type === "NOT") return null;
  // 한 글자로 후보를 좁히면 ‘더파르마’와 ‘더 파르마’를 모두 유지할 수 있다.
  if (node.type === "TERM") {
    const letter = node.value.match(/[가-힣]/)?.[0];
    return letter ? [letter] : null;
  }
  const left = sourceSearchKeywords(node.left);
  const right = sourceSearchKeywords(node.right);
  if (node.type === "AND") return !left ? right : !right ? left : left.length <= right.length ? left : right;
  return left && right ? [...new Set([...left, ...right])] : null;
}

export async function fetchHealthProductDetailLive(id) {
  if (!/^\d{1,30}$/.test(String(id || ""))) {
    const error = new Error("제품 ID가 올바르지 않습니다.");
    error.status = 400;
    throw error;
  }
  return fetchProductDetail(await openSession(), { id });
}

export async function fetchHealthProductTypesLive(ids) {
  if (!Array.isArray(ids) || !ids.length || ids.length > HEALTH_PRODUCT_PAGE_SIZE || ids.some((id) => typeof id !== "string" || !/^\d{1,30}$/.test(id))) {
    const error = new Error("조회할 제품 ID는 1~20개여야 합니다.");
    error.status = 400;
    throw error;
  }
  const details = await fetchHealthProductDetails(ids.map((id) => ({ id })), { concurrency: 5 });
  return { items: details.map((item) => ({ id: item.id, allTypes: item.allTypes || "", typeError: item.detailError || "" })) };
}

export async function fetchHealthProductIndex({ keywords = null, bulk = false } = {}) {
  const session = await openSession();
  const included = [];
  let excluded = [];
  if (keywords?.length) {
    for (const keyword of keywords) included.push(...await fetchProductList(session, "I", keyword, bulk));
  } else {
    const lists = await Promise.allSettled([fetchProductList(session, "I", " ", bulk), fetchProductList(session, "E", " ", bulk)]);
    const failed = lists.find((result) => result.status === "rejected");
    if (failed) throw failed.reason;
    included.push(...lists[0].value);
    excluded = lists[1].value;
  }
  const byId = new Map();
  for (const row of [...included, ...excluded]) {
    const item = normalizeListItem(row);
    if (item.id) byId.set(item.id, item);
  }
  const items = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "ko")).map((item, index) => ({ ...item, index }));
  return {
    syncedAt: new Date().toISOString(), sourceUrl: HEALTH_PRODUCTS_SOURCE_URL,
    listComplete: true, sourceCounts: { included: included.length, excluded: excluded.length },
    duplicateCount: included.length + excluded.length - items.length,
    total: items.length, detailTotal: 0, nextDetailIndex: 0, searchIndexedThrough: 0, complete: !items.length, items
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
      if (item.active === false) {
        results[index] = { ...item, tables: [] };
        continue;
      }
      try {
        results[index] = { ...item, ...await fetchProductDetail(session, item) };
      } catch (error) {
        results[index] = { ...item, detailError: error.message || "상세정보 조회 실패", tables: [] };
      }
    }
  }));
  return results;
}

export function refreshHealthProductIndex(current, fetched) {
  if (!current) return fetched;
  if (!fetched.items.length && current.items.length) throw new Error("새 제품 목록이 비어 있어 기존 자료를 유지합니다.");
  const byId = new Map(fetched.items.map((item) => [item.id, item]));
  const existingIds = new Set(current.items.map((item) => item.id));
  const items = current.items.map((item) => ({ ...item, ...byId.get(item.id), index: item.index, active: byId.has(item.id) }));
  for (const item of fetched.items) {
    if (!existingIds.has(item.id)) items.push({ ...item, index: items.length, active: true });
  }
  return { ...current, items, total: items.length, activeTotal: fetched.items.length, syncedAt: fetched.syncedAt,
    sourceCounts: fetched.sourceCounts, duplicateCount: fetched.duplicateCount, listComplete: fetched.listComplete,
    complete: items.length <= current.detailTotal && current.searchIndexedThrough >= current.detailTotal };
}

export function pageHealthProducts(index, details, { page = 1, matchedIds = null, keyword = "", company = "", includeExport = true } = {}) {
  const term = searchKey(keyword);
  const companyTerm = searchKey(company);
  const activeItems = (index?.items || []).filter((item) => item.active !== false);
  const filtered = activeItems.filter((item) => (!matchedIds || matchedIds.has(item.id))
    && (!companyTerm || searchKey(item.company).includes(companyTerm))
    && (includeExport || !/[（(]\s*수출용\s*[)）]/.test(item.name || ""))
    && (!term || [item.name, item.company, item.reportNumber].some((value) => searchKey(value).includes(term))));
  const totalPages = Math.max(1, Math.ceil(filtered.length / HEALTH_PRODUCT_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (currentPage - 1) * HEALTH_PRODUCT_PAGE_SIZE;
  const detailMap = new Map((details || []).map((item) => [item.id, item]));
  return {
    page: currentPage, pageSize: HEALTH_PRODUCT_PAGE_SIZE, total: filtered.length, totalPages,
    items: filtered.slice(start, start + HEALTH_PRODUCT_PAGE_SIZE).map((item) => ({ ...item, detail: detailMap.get(item.id) || null })),
    indexedTotal: activeItems.length, detailTotal: activeItems.filter((item) => item.index < (index?.detailTotal || 0)).length,
    searchIndexedThrough: index?.searchIndexedThrough || 0,
    complete: activeItems.every((item) => item.index < Number(index?.detailTotal || 0) && item.index < Number(index?.searchIndexedThrough || 0)),
    syncedAt: index?.syncedAt || null, sourceUrl: index?.sourceUrl || HEALTH_PRODUCTS_SOURCE_URL,
    listComplete: Boolean(index?.listComplete), sourceCounts: index?.sourceCounts || null
  };
}

export function healthProductListCsv(items) {
  const rows = [["제품ID", "제품명", "업체명", "품목보고번호", "품목유형", "소비기한", "내수/수출", "분류코드"],
    ...items.map((item) => [item.id, item.name, item.company, item.reportNumber, item.type, item.shelfLife, item.domesticExport, item.categoryCode])];
  return "\uFEFF" + rows.map((row) => row.map((value) => {
    let cell = String(value ?? "");
    if (/^[\s]*[=+@-]|^[\t\r\n]/.test(cell)) cell = "'" + cell;
    return `"${cell.replaceAll('"', '""')}"`;
  }).join(",")).join("\r\n") + "\r\n";
}

export function buildHealthProductSearchRows(details) {
  return (details || []).map((item) => ({ id: item.id, ingredients: ingredientText(item.tables) })).filter((item) => item.id);
}

export function mergeHealthProductSearchRows(items, detailRows) {
  const byId = new Map((items || []).map((item) => [item.id, { id: item.id, ingredients: item.type || "" }]));
  for (const row of detailRows || []) {
    const current = byId.get(row.id);
    byId.set(row.id, { id: row.id, ingredients: [current?.ingredients, row.ingredients].filter(Boolean).join(" | ") });
  }
  return [...byId.values()];
}

export function filterHealthProducts(items, detailRows, query, target = "ingredients") {
  if (target === "name") return filterHealthProductSearchRows(items.map((item) => ({ id: item.id, ingredients: item.name })), query);
  const rows = mergeHealthProductSearchRows(items, detailRows);
  if (target === "all") {
    const names = new Map(items.map((item) => [item.id, item.name]));
    for (const row of rows) row.ingredients = [names.get(row.id), row.ingredients].filter(Boolean).join(" | ");
  }
  return filterHealthProductSearchRows(rows, query);
}

export function filterHealthProductSearchRows(rows, query) {
  const expression = parseBooleanQuery(query);
  if (!expression) return new Set((rows || []).map((item) => item.id));
  return new Set((rows || []).filter((item) => evaluate(expression, searchKey(item.ingredients))).map((item) => item.id));
}

export function filterHealthProductTypes(items, query, { includeName = false } = {}) {
  const rows = items.filter((item) => typeof item.allTypes === "string" && !item.typeError && !item.detailError)
    .map((item) => ({ id: item.id, ingredients: includeName ? `${item.name || ""} | ${item.allTypes}` : item.allTypes }));
  return filterHealthProductSearchRows(rows, query);
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
    allTypes: fields["유형"] || "",
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

async function fetchProductList(session, condition, keyword = " ", bulk = false) {
  const pageSize = bulk ? 500 : 2000;
  const timeoutMs = bulk ? 120000 : 45000;
  const body = new URLSearchParams({
    s_mode: "1", s_opt: "all", s_induty_cd: "131,132", s_prdlst_grp: "E0000000000000",
    s_prdlst_cd: "all", s_bsn_nm: "", s_prd_nm: "", s_prdlst_report_no: "",
    s_opt1: condition, s_keyword1: keyword, s_opt2: "Y", s_opt3: "0", s_keyword2: "",
    s_order_by: bulk ? "reg_dt" : "prdlst_nm", s_list_cnt: String(pageSize), s_page_num: "1", s_prefix: "",
    s_halal_yn: "", s_highlow_yn: "", s_dsp_yn: "", s_child_yn: "", s_tx_id: "1",
    s_bar_cd: "", callPage: session.callPage
  });
  const count = await requestProductList(session, "searchPrdListCnt_1", body, timeoutMs);
  if (count.totCnt === null || count.totCnt === undefined || count.totCnt === "" || !Number.isSafeInteger(Number(count.totCnt)) || Number(count.totCnt) < 0) {
    throw new Error("식품안전나라 전체 건수 형식이 변경되었습니다.");
  }
  const expected = Number(count.totCnt);
  const pages = [];
  const pageCount = Math.ceil(expected / pageSize);
  let cursor = 0;
  let failure;
  await Promise.all(Array.from({ length: Math.min(bulk ? 1 : 3, pageCount) }, async () => {
    while (cursor < pageCount && !failure) {
      const page = cursor++;
      const params = new URLSearchParams(body);
      params.set("s_page_num", String(page + 1));
      try {
        const payload = await requestProductList(session, "searchPrdList_1", params, timeoutMs);
        if (!Array.isArray(payload.prdList)) throw new Error("식품안전나라 제품 목록 형식이 변경되었습니다.");
        if (payload.prdList.length !== Math.min(pageSize, expected - page * pageSize)) {
          throw new Error(`식품안전나라 목록 건수 불일치 (${condition}, ${page + 1}페이지). 다시 검색해주세요.`);
        }
        pages[page] = payload.prdList;
        if (bulk) console.log(`목록 ${condition}: ${page + 1}/${pageCount}페이지 확인`);
      } catch (error) { failure ||= error; }
    }
  }));
  if (failure) throw failure;
  const rows = pages.flat();
  // E분류 검색에도 식품(001) 기록이 있어 목록의 품목분류 코드로 검증한다.
  if (rows.some((row) => typeof row.PRDLST_REPORT_LEDG_NO !== "string" || !row.PRDLST_REPORT_LEDG_NO || !String(row.PREFIX_PRDLST_CD || row.PRDLST_CD || "").startsWith("E"))
    || new Set(rows.map((row) => row.PRDLST_REPORT_LEDG_NO)).size !== expected) {
    throw new Error("식품안전나라 제품 ID·분류·중복 검증에 실패했습니다. 다시 수집해주세요.");
  }
  return rows;
}

async function requestProductList(session, endpoint, body, timeoutMs) {
  const response = await fetch(`${ORIGIN}/ajax/portal/specialinfo/${endpoint}.do`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", Cookie: session.cookie, Referer: HEALTH_PRODUCTS_SOURCE_URL, "X-Requested-With": "XMLHttpRequest" },
    body,
    signal: AbortSignal.timeout(timeoutMs)
  }).catch((error) => {
    console.error(`원본 요청 실패: ${endpoint}, 조건 ${body.get("s_opt1")}, 페이지 ${body.get("s_page_num")}: ${error.message}`);
    throw error;
  });
  if (!response.ok) throw new Error(`식품안전나라 제품 목록 오류 (${response.status})`);
  const payload = await response.json();
  if (!payload || typeof payload !== "object") throw new Error("식품안전나라 검색 응답이 올바르지 않습니다.");
  return payload;
}

async function fetchProductDetail(session, item) {
  const url = `${ORIGIN}/iframe/specialinfo/prdInfoDetail.do?prdlstReportLedgNo=${encodeURIComponent(item.id)}&from=searchCompany&callPage=${encodeURIComponent(session.callPage)}`;
  const response = await fetch(url, { headers: { Cookie: session.cookie, Referer: HEALTH_PRODUCTS_SOURCE_URL }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`상세정보 응답 오류 (${response.status})`);
  const tables = parseDetailTables(await response.text());
  if (!tables.some((table) => table.rows.some((row) => row.some((cell) => cell.replace(/\s+/g, "") === "제품명")))) {
    throw new Error("제품 상세 표를 찾지 못했습니다.");
  }
  return { fetchedAt: new Date().toISOString(), sourceUrl: url, tables, ingredientText: ingredientText(tables), ...detailFields(tables) };
}

function normalizeListItem(row) {
  return {
    id: String(row.PRDLST_REPORT_LEDG_NO || ""), name: String(row.PRDLST_NM || ""),
    company: String(row.BSSH_NM || ""), reportNumber: String(row.PRDLST_REPORT_NO || ""),
    type: String(row.PRDLST_CD_NM || ""), shelfLife: String(row.POG_DAYCNT || ""),
    domesticExport: String(row.PRDT_SIL_SRV || ""), categoryCode: String(row.PRDLST_CD || "")
  };
}

function ingredientText(tables) {
  const values = [];
  for (const table of tables || []) {
    const headerIndex = table.rows.findIndex((row) => row.some((cell) => /성분\s*및\s*원료|원재료명/.test(cell)));
    if (headerIndex < 0) continue;
    const column = table.rows[headerIndex].findIndex((cell) => /성분\s*및\s*원료|원재료명/.test(cell));
    for (const row of table.rows.slice(headerIndex + 1)) {
      if (row[column]) values.push(row[column]);
    }
  }
  return values.join(" | ");
}

function parseBooleanQuery(query) {
  const source = String(query || "").trim();
  if (!source) return null;
  const raw = [...source.matchAll(/"([^"]+)"|'([^']+)'|\(|\)|\bAND\b|\bOR\b|\bNOT\b|[^\s()]+/gi)].map((match) => {
    const value = match[1] || match[2] || match[0];
    const upper = value.toUpperCase();
    return ["AND", "OR", "NOT"].includes(upper) ? { type: upper } : value === "(" ? { type: "(" } : value === ")" ? { type: ")" } : { type: "TERM", value: searchKey(value) };
  });
  const tokens = [];
  for (const token of raw) {
    const previous = tokens.at(-1);
    if (previous && ["TERM", ")"].includes(previous.type) && ["TERM", "(", "NOT"].includes(token.type)) tokens.push({ type: "AND" });
    tokens.push(token);
  }
  let position = 0;
  const parseOr = () => {
    let node = parseAnd();
    while (tokens[position]?.type === "OR") { position++; node = { type: "OR", left: node, right: parseAnd() }; }
    return node;
  };
  const parseAnd = () => {
    let node = parseNot();
    while (tokens[position]?.type === "AND") { position++; node = { type: "AND", left: node, right: parseNot() }; }
    return node;
  };
  const parseNot = () => tokens[position]?.type === "NOT" ? (position++, { type: "NOT", value: parseNot() }) : parsePrimary();
  const parsePrimary = () => {
    const token = tokens[position++];
    if (!token) throw queryError();
    if (token.type === "TERM") return token;
    if (token.type === "(") {
      const node = parseOr();
      if (tokens[position++]?.type !== ")") throw queryError();
      return node;
    }
    throw queryError();
  };
  const result = parseOr();
  if (position !== tokens.length) throw queryError();
  return result;
}

function evaluate(node, text) {
  if (node.type === "TERM") return text.includes(node.value);
  if (node.type === "NOT") return !evaluate(node.value, text);
  if (node.type === "AND") return evaluate(node.left, text) && evaluate(node.right, text);
  return evaluate(node.left, text) || evaluate(node.right, text);
}

function queryError() {
  const error = new Error("검색식이 올바르지 않습니다. AND, OR, NOT과 괄호의 위치를 확인해주세요.");
  error.code = "INVALID_QUERY";
  error.status = 400;
  return error;
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
  const searchRows = buildHealthProductSearchRows([{ id: "1", tables }, { id: "2", tables: [{ rows: [["성분 및 원료"], ["마그네슘"]] }] }]);
  assert.equal(searchRows[0].ingredients, "비타민 C");
  assert.deepEqual([...filterHealthProductSearchRows(searchRows, '(비타민 AND C) OR 마그네슘')], ["1", "2"]);
  assert.deepEqual([...filterHealthProductSearchRows(searchRows, '비타민 AND NOT 마그네슘')], ["1"]);
  assert.deepEqual([...filterHealthProductSearchRows(searchRows, '"비타민 C"')], ["1"]);
  assert.throws(() => filterHealthProductSearchRows(searchRows, "비타민 AND"), /검색식/);
  assert.deepEqual([...filterHealthProductSearchRows(mergeHealthProductSearchRows([{ id: "3", type: "EPA 및 DHA 함유 유지" }], []), "EPA")], ["3"]);
  assert.deepEqual([...filterHealthProductSearchRows([{ id: "4", ingredients: "뉴 마그네슘350+B6" }], "뉴 마그네슘350+B6")], ["4"]);
  const targets = [{ id: "4", name: "뉴 마그네슘350+B6", type: "미네랄" }];
  assert.deepEqual([...filterHealthProducts(targets, [{ id: "4", ingredients: "산화마그네슘" }], "뉴 AND 산화마그네슘", "all")], ["4"]);
  assert.deepEqual([...filterHealthProducts(targets, [], "뉴 마그네슘350+B6", "name")], ["4"]);
  assert.equal(filterHealthProducts(targets, [], "뉴", "ingredients").size, 0);
  const refreshed = refreshHealthProductIndex({ items: [{ id: "1", name: "기존", index: 0 }, { id: "3", name: "사라진", index: 1 }], total: 2, detailTotal: 2, searchIndexedThrough: 2 },
    { items: [{ id: "1", name: "변경" }, { id: "2", name: "신규" }], syncedAt: "today" });
  assert.deepEqual(refreshed.items.map((item) => [item.id, item.name, item.index, item.active]), [["1", "변경", 0, true], ["3", "사라진", 1, false], ["2", "신규", 2, true]]);
  assert.equal(pageHealthProducts(refreshed, [], {}).total, 2);
  assert.equal(pageHealthProducts(refreshed, [], {}).detailTotal, 1);
  assert.equal(refreshed.detailTotal, 2);
  assert.equal(refreshed.complete, false);
  assert.equal(pageHealthProducts(refreshHealthProductIndex(refreshed, { items: [{ id: "3", name: "복구" }], syncedAt: "later" }), [], {}).total, 1);
  const exportIndex = { items: [{ id: "1", name: "일반 제품" }, { id: "2", name: "제품(수출용)" }, { id: "3", name: "제품（수출용）" }] };
  assert.equal(pageHealthProducts(exportIndex, [], { includeExport: false }).total, 1);
  assert.equal(pageHealthProducts(exportIndex, [], { includeExport: true }).total, 3);
  console.log("health product parser ok");
}
