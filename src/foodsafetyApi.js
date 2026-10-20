export const FOODSAFETY_API_SOURCE_URL = "https://www.foodsafetykorea.go.kr/api/openApiInfo.do?svc_no=I0030";

export async function fetchFoodsafetyApiPage(start, end, reportNumber = "") {
  const key = String(process.env.FOODSAFETY_API_KEY || "").trim();
  if (!/^[a-zA-Z0-9]{10,128}$/.test(key) || key === "sample") {
    const error = new Error("식품안전나라 공식 API 인증키가 설정되지 않았습니다."); error.status = 503; throw error;
  }
  const suffix = reportNumber ? `/PRDLST_REPORT_NO=${encodeURIComponent(reportNumber)}` : "";
  let payload;
  try {
    const response = await fetch(`https://openapi.foodsafetykorea.go.kr/api/${key}/I0030/json/${start}/${end}${suffix}`, { signal: AbortSignal.timeout(45000) });
    if (!response.ok) throw new Error();
    payload = await response.json();
  } catch {
    // 인증키가 포함된 요청 URL은 오류 메시지와 로그에 남기지 않는다.
    throw new Error("식품안전나라 공식 API 응답을 받지 못했습니다.");
  }
  const data = payload.I0030;
  const result = data?.RESULT || payload.RESULT;
  if (result?.CODE !== "INFO-000" && result?.CODE !== "INFO-200") {
    const code = /^INFO-\d{3}$/.test(result?.CODE || "") ? result.CODE : "응답 형식 변경";
    throw new Error(`식품안전나라 공식 API 오류 (${code}). 인증키·I0030 이용신청 상태를 확인해주세요.`);
  }
  if (result.CODE === "INFO-200") return { total: 0, rows: [] };
  if (data?.total_count === undefined || data.total_count === null || data.total_count === "") throw new Error("공식 API 전체 건수가 없습니다.");
  const total = Number(data.total_count);
  if (!Number.isSafeInteger(total) || total < 0 || (total > 0 && !Array.isArray(data?.row))) throw new Error("공식 API 건수·목록 검증에 실패했습니다.");
  return { total, rows: data?.row || [] };
}

export function normalizeFoodsafetyProduct(row, fetchedAt) {
  if (typeof row.PRDLST_REPORT_NO !== "string" || !/^\d{1,30}$/.test(row.PRDLST_REPORT_NO) || typeof row.PRDLST_NM !== "string" || typeof row.BSSH_NM !== "string"
    || !Object.hasOwn(row, "RAWMTRL_NM") || (row.RAWMTRL_NM !== null && typeof row.RAWMTRL_NM !== "string")) {
    throw new Error("공식 API 제품·전체 유형 항목 검증에 실패했습니다.");
  }
  return { id: row.PRDLST_REPORT_NO, reportNumber: row.PRDLST_REPORT_NO, detailLookup: "report",
    name: row.PRDLST_NM, company: row.BSSH_NM, type: row.PRDLST_CDNM || "", allTypes: row.RAWMTRL_NM || "",
    shelfLife: row.POG_DAYCNT || "", domesticExport: "원문 미제공", categoryCode: "", typesFetchedAt: fetchedAt,
    productionEnded: row.PRODUCTION === "예", sourceUpdatedAt: row.LAST_UPDT_DTM || "" };
}

export async function fetchFoodsafetyProductDetail(reportNumber) {
  if (typeof reportNumber !== "string" || !/^\d{1,30}$/.test(reportNumber)) {
    const error = new Error("품목보고번호가 올바르지 않습니다."); error.status = 400; throw error;
  }
  const result = await fetchFoodsafetyApiPage(1, 1000, reportNumber);
  const row = result.rows.find((item) => item.PRDLST_REPORT_NO === reportNumber);
  if (!row) { const error = new Error("공식 API에서 제품을 찾지 못했습니다."); error.status = 404; throw error; }
  const fetchedAt = new Date().toISOString();
  const item = normalizeFoodsafetyProduct(row, fetchedAt);
  const fields = [["제품명", "PRDLST_NM"], ["업체명", "BSSH_NM"], ["품목보고번호", "PRDLST_REPORT_NO"],
    ["품목유형", "PRDLST_CDNM"], ["유형", "RAWMTRL_NM"], ["소비기한", "POG_DAYCNT"], ["제품형태", "PRDT_SHAP_CD_NM"],
    ["섭취방법", "NTK_MTHD"], ["주된기능성", "PRIMARY_FNCLTY"], ["섭취시주의사항", "IFTKN_ATNT_MATR_CN"],
    ["기준규격", "STDR_STND"], ["기능성 원재료", "INDIV_RAWMTRL_NM"], ["기타 원재료", "ETC_RAWMTRL_NM"],
    ["캡슐 원재료", "CAP_RAWMTRL_NM"], ["보관방법", "CSTDY_MTHD"], ["포장방법", "FRMLC_MTHD"], ["포장재질", "FRMLC_MTRQLT"]];
  return { allTypes: item.allTypes, fetchedAt, sourceUrl: FOODSAFETY_API_SOURCE_URL,
    tables: [{ number: 1, rows: fields.map(([name, key]) => [name, String(row[key] || "").replace(/\\r\\n|\\n|\\r/g, "\n")]) }] };
}
