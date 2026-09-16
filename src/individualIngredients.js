import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";

const ORIGIN = "https://www.foodsafetykorea.go.kr";
const SOURCE_URL = `${ORIGIN}/portal/board/board.do?menu_grp=MENU_NEW01&menu_no=2660`;
const PAGE_SIZE = 20;

export async function syncHealthFunctionalIngredients() {
  const form = new URLSearchParams({
    menu_no: "2660", menu_grp: "MENU_NEW01", bbs_no: "bbs987", ctgry_no: "", hrnk_ctgryno: "",
    ctgry_type_cd: "CTG_TYPE01", bbs_type_cd: "01", nticmatr_yn: "N", ans_yn: "N",
    search_type: "title", search_keyword: ""
  });
  const response = await fetch(`${ORIGIN}/portal/board/downloadBbsList.do`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Referer: SOURCE_URL },
    body: form,
    signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) throw new Error(`식품안전나라 응답 오류 (${response.status})`);

  const workbook = XLSX.read(await response.arrayBuffer(), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const items = rows.map((row) => normalizeIngredient({
    no: row["순번"], cret_dtm: row["등록일"], titl: row["제목"], category: row["카테고리"]
  }, parseIngredientDetail(row["상세내용"]))).filter((item) => item.ingredient);

  return {
    syncedAt: new Date().toISOString(),
    source: "식품안전나라 건강기능식품 원료별 정보",
    sourceUrl: SOURCE_URL,
    total: items.length,
    items
  };
}

export function pageHealthFunctionalIngredients(cache, { page = 1, query = "" } = {}) {
  const normalizedQuery = searchKey(query);
  const items = (cache?.items || []).filter((item) => !normalizedQuery || [item.ingredient, item.company, item.functionality]
    .some((value) => searchKey(value).includes(normalizedQuery)));
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;

  return {
    page: currentPage,
    pageSize: PAGE_SIZE,
    total: items.length,
    totalPages,
    items: items.slice(start, start + PAGE_SIZE),
    source: cache?.source || "식품안전나라 건강기능식품 원료별 정보",
    syncedAt: cache?.syncedAt || null
  };
}

export function parseIngredientDetail(html) {
  const text = decodeHtml(String(html || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "));
  const start = text.indexOf("○ 원료명");
  const ends = [text.indexOf("※ English version", start), text.indexOf("○ 원료명", start + 1)].filter((index) => index > start);
  const block = start < 0 ? text : text.slice(start, ends.length ? Math.min(...ends) : undefined);
  const cautionText = block.match(/○\s*섭취\s*시\s*주의사항\s*:?[\s\S]*$/)?.[0] || "";
  const noteIndex = cautionText.indexOf("※");
  return {
    ingredient: field(block, "원료명", "인정번호"),
    recognitionNumber: field(block, "인정번호", "(?:업체명|업체)"),
    company: field(block, "(?:업체명|업체)", "기능성내용"),
    functionality: field(block, "기능성내용", "일일섭취량"),
    dailyIntake: field(block, "일일섭취량", "섭취 시 주의사항"),
    cautions: clean((noteIndex < 0 ? cautionText : cautionText.slice(0, noteIndex)).replace(/^○\s*섭취\s*시\s*주의사항\s*:?\s*/, "")),
    other: clean(noteIndex < 0 ? "" : cautionText.slice(noteIndex)),
    cancelled: /인정\s*취소|자진\s*반납|말소/.test(block)
  };
}

function field(text, label, nextLabel) {
  const match = text.match(new RegExp(`○\\s*${label}\\s*:\\s*([\\s\\S]*?)(?=○\\s*${nextLabel}(?:\\s*:|\\s|$))`));
  return match ? clean(match[1]) : "";
}

function normalizeIngredient(row, detail) {
  const title = String(row.titl || "");
  const recognitionNumber = detail.recognitionNumber || title.match(/제?\d{4}-\d+호/)?.[0] || "";
  const tail = title.match(/\(([^()]*)\s*,\s*제?\d{4}-\d+호\)\s*$/);
  const unavailable = String(row.category || "") === "사용불가 원료" || detail.cancelled || /인정\s*취소|자진\s*반납|말소/.test(title);
  return {
    number: String(row.no || ""),
    registeredDate: String(row.cret_dtm || ""),
    validity: unavailable ? "유효하지 않음" : "유효",
    ingredient: detail.ingredient || title.replace(/\([^()]*,\s*제?\d{4}-\d+호\)\s*$/, "").trim(),
    recognitionNumber,
    company: detail.company || tail?.[1] || "",
    functionality: detail.functionality || "상세 원문 확인 필요",
    dailyIntake: detail.dailyIntake || "",
    cautions: detail.cautions || "",
    other: detail.other || "",
    category: String(row.category || "")
  };
}

function clean(value) {
  return String(value || "").replace(/-{3,}/g, "").replace(/(^|\s)[-·]\s*/g, " · ").replace(/\s+/g, " ").replace(/^[·\s]+|[·\s]+$/g, "").trim();
}

function searchKey(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function decodeHtml(value) {
  return value.replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;|&#034;/gi, '"').replace(/&#39;/gi, "'").replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv.includes("--self-check")) {
  const parsed = parseIngredientDetail("<p>○ 원료명 : 테스트추출물</p><p>○ 인정번호 : 제2026-1호(2026.1.2.)</p><p>○ 업체 : 테스트㈜</p><p>○ 기능성내용 : 눈 건강에 도움을 줄 수 있음</p><p>○ 일일섭취량 : 100 mg/일</p><p>○ 섭취 시 주의사항</p><p>- 임산부는 주의할 것</p><p>※ 자진반납에 따른 인정취소(2026.2.1.)</p>");
  assert.equal(parsed.company, "테스트㈜");
  assert.equal(parsed.cautions, "임산부는 주의할 것");
  assert.equal(parsed.cancelled, true);
  const sample = { items: [{ ingredient: "원료A", company: "고려은단", functionality: "눈 건강" }, { ingredient: "루테인", company: "다른회사", functionality: "체지방 감소" }] };
  assert.equal(pageHealthFunctionalIngredients(sample, { query: "고려은단" }).total, 1);
  assert.equal(pageHealthFunctionalIngredients(sample, { query: "눈 건강" }).total, 1);
  console.log("health functional ingredient parser ok");
}
