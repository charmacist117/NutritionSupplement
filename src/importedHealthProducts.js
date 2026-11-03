export const IMPORTED_PRODUCT_APIS = {
  item: { endpoint: "IprtFoodPrdtKoreanLabelingItem/getIprtFoodPrdtKoreanLabelingItem", sourceUrl: "https://www.data.go.kr/data/15110214/openapi.do" },
  text: { endpoint: "IprtFoodPrdtKoreanLabelingText/getIprtFoodPrdtKoreanLabelingText", sourceUrl: "https://www.data.go.kr/data/15110213/openapi.do" }
};

export async function fetchImportedHealthProductPage(source, page = 1, pageSize = 100) {
  const api = IMPORTED_PRODUCT_APIS[source];
  if (!api || !Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 1000) {
    const error = new Error("수입제품 조회 조건을 확인해주세요."); error.status = 400; throw error;
  }
  let key = String(process.env.DATA_GO_KR_API_KEY || "").trim();
  try { key = decodeURIComponent(key); } catch { key = ""; }
  if (key.length < 10 || key.length > 2048 || /\s/.test(key)) {
    const error = new Error("수입제품용 공공데이터포털 인증키(DATA_GO_KR_API_KEY)가 설정되지 않았습니다.");
    error.status = 503; error.code = "IMPORT_API_KEY_MISSING"; throw error;
  }
  const params = new URLSearchParams({ serviceKey: key, type: "json", pageNo: String(page), numOfRows: String(pageSize), dclPrductSeCdNm: "건강기능식품" });
  let payload;
  try {
    const response = await fetch(`https://apis.data.go.kr/1471000/${api.endpoint}?${params}`, { signal: AbortSignal.timeout(45000) });
    if (!response.ok) throw new Error();
    payload = await response.json();
  } catch {
    // 인증키가 포함된 URL과 원본 오류를 외부 응답·로그에 남기지 않는다.
    throw new Error("수입제품 공식 API 응답을 받지 못했습니다. 인증키와 서비스 승인 상태를 확인해주세요.");
  }
  const data = payload.response || payload;
  const code = String(data.header?.resultCode ?? "");
  if (!["00", "0", "0000"].includes(code)) {
    const safeCode = /^[A-Z0-9_-]{1,40}$/i.test(code) ? code : "응답 형식 변경";
    throw new Error(`수입제품 공식 API 오류 (${safeCode}). 해당 서비스의 활용신청·승인 상태를 확인해주세요.`);
  }
  const body = data.body;
  const total = Number(body?.totalCount);
  const items = body?.items;
  const rawRows = Array.isArray(items) ? items.flatMap((entry) => entry?.item || entry) : items?.item;
  const rows = Array.isArray(rawRows) ? rawRows : rawRows && typeof rawRows === "object" ? [rawRows] : [];
  if (body?.totalCount === undefined || body.totalCount === null || body.totalCount === "" || !Number.isSafeInteger(total) || total < 0
    || rows.length !== Math.min(pageSize, Math.max(0, total - (page - 1) * pageSize))
    || rows.some((row) => !row || row.DCL_PRDUCT_SE_CD_NM !== "건강기능식품")) {
    const error = new Error("수입제품 공식 API의 전체 건수·페이지 누락·건강기능식품 구분 검증에 실패했습니다.");
    error.details = { total: body?.totalCount, rows: rows.length, pageSize, bodyFields: Object.keys(body || {}),
      itemsFields: items && !Array.isArray(items) ? Object.keys(items) : [],
      rowFields: Object.keys(rows[0] || {}), productGroups: [...new Set(rows.map((row) => row.DCL_PRDUCT_SE_CD_NM))] };
    throw error;
  }
  return { total, rows, sourceUrl: api.sourceUrl };
}
