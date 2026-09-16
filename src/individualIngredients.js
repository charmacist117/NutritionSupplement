import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const ORIGIN = "https://www.foodsafetykorea.go.kr";
const PAGE_SIZE = 20;

export async function fetchIndividualIngredients({ page = 1, query = "" } = {}) {
  const currentPage = Math.max(1, Number(page) || 1);
  const form = new URLSearchParams({
    menu_no: "2660", menu_grp: "MENU_NEW01", bbs_no: "bbs987", start_idx: String(currentPage),
    ctgry_no: "1207", hrnk_ctgryno: "", ctgry_type_cd: "CTG_TYPE01", bbs_type_cd: "01",
    nticmatr_yn: "N", ans_yn: "N", show_cnt: String(PAGE_SIZE), search_type: "title", search_keyword: String(query || "").slice(0, 100)
  });
  const data = await fetchSource("/portal/board/boardList.do", form, true);
  const list = Array.isArray(data.list) ? data.list : [];
  const items = await mapLimit(list, 5, async (row) => {
    try {
      const detail = await fetchSource("/portal/board/boardDetail.do", new URLSearchParams({
        menu_no: "2660", menu_grp: "MENU_NEW01", bbs_no: "bbs987", ntctxt_no: row.ntctxt_no,
        start_idx: String(currentPage), ctgry_no: "1207", ctgry_type_cd: "CTG_TYPE01", bbs_type_cd: "01"
      }));
      return normalizeIngredient(row, parseIngredientDetail(detail));
    } catch {
      return normalizeIngredient(row, {});
    }
  });
  const total = Number(data.total_cnt || 0);
  return { page: currentPage, pageSize: PAGE_SIZE, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)), items, source: "식품안전나라 건강기능식품 원료별 정보" };
}

async function fetchSource(path, body, json = false) {
  const response = await fetch(`${ORIGIN}${path}`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Referer: `${ORIGIN}/portal/board/board.do?menu_grp=MENU_NEW01&menu_no=2660` },
    body, signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`식품안전나라 응답 오류 (${response.status})`);
  return json ? response.json() : response.text();
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
    recognitionNumber: field(block, "인정번호", "업체명"),
    company: field(block, "업체명", "기능성내용"),
    functionality: field(block, "기능성내용", "일일섭취량"),
    dailyIntake: field(block, "일일섭취량", "섭취 시 주의사항"),
    cautions: clean(clean(noteIndex < 0 ? cautionText : cautionText.slice(0, noteIndex)).replace(/^○\s*섭취\s*시\s*주의사항\s*:?\s*/, "")),
    other: clean(noteIndex < 0 ? "" : cautionText.slice(noteIndex)),
    cancelled: /인정\s*취소|자진\s*반납|말소/.test(block)
  };
}

function field(text, label, nextLabel) {
  const match = text.match(new RegExp(`○\\s*${label}\\s*:\\s*([\\s\\S]*?)(?=○\\s*${nextLabel}(?:\\s*:|\\s|$))`));
  return match ? clean(match[1]) : "";
}

function clean(value) {
  return String(value || "").replace(/-{3,}/g, "").replace(/(^|\s)[-·]\s*/g, " · ").replace(/\s+/g, " ").replace(/^[·\s]+|[·\s]+$/g, "").trim();
}

function normalizeIngredient(row, detail) {
  const title = String(row.titl || "");
  const number = detail.recognitionNumber?.match(/제?\d{4}-\d+호/)?.[0] || title.match(/제?\d{4}-\d+호/)?.[0] || "";
  const recognitionDate = detail.recognitionNumber?.match(/\((\d{4}\.\d{1,2}\.\d{1,2})\.??\)/)?.[1] || "";
  const tail = title.match(/\(([^()]*)\s*,\s*제?\d{4}-\d+호\)\s*$/);
  return {
    number: row.no || "", registeredDate: row.cret_dtm || "", recognitionDate, validity: detail.cancelled ? "취소 이력 있음" : "유효",
    ingredient: detail.ingredient || title.replace(/\([^()]*,\s*제?\d{4}-\d+호\)\s*$/, "").trim(),
    recognitionNumber: number, company: detail.company || tail?.[1] || "",
    functionality: detail.functionality || "상세 원문 확인 필요", dailyIntake: detail.dailyIntake || "",
    cautions: detail.cautions || "", other: detail.other || "", sourceId: row.ntctxt_no || ""
  };
}

function decodeHtml(value) {
  return value.replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;|&#034;/gi, '"').replace(/&#39;/gi, "'").replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

async function mapLimit(items, limit, mapper) {
  const result = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const index = next++; result[index] = await mapper(items[index]); }
  }));
  return result;
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv.includes("--self-check")) {
  const parsed = parseIngredientDetail("<p>○ 원료명 : 테스트추출물</p><p>○ 인정번호 : 제2026-1호(2026.1.2.)</p><p>○ 업체명 : 테스트㈜</p><p>○ 기능성내용 : 눈 건강에 도움을 줄 수 있음</p><p>○ 일일섭취량 : 100 mg/일</p><p>○ 섭취 시 주의사항</p><p>- 임산부는 주의할 것</p><p>※ 자진반납에 따른 인정취소(2026.2.1.)</p>");
  assert.deepEqual(parsed, { ingredient: "테스트추출물", recognitionNumber: "제2026-1호(2026.1.2.)", company: "테스트㈜", functionality: "눈 건강에 도움을 줄 수 있음", dailyIntake: "100 mg/일", cautions: "임산부는 주의할 것", other: "※ 자진반납에 따른 인정취소(2026.2.1.)", cancelled: true });
  console.log("individual ingredient parser ok");
}
