import { gzipSync } from "node:zlib";
import { loadProductTypeCatalog, searchHealthProducts } from "./productTypeCatalog.js";

export async function getHealthProductExport(options = {}) {
  const [result, catalog] = await Promise.all([
    searchHealthProducts({ ...options, page: 1, allResults: true }),
    (options.target || "name") === "name" ? loadProductTypeCatalog() : null
  ]);
  if (catalog) {
    const byReport = new Map(catalog.items.map((item) => [item.reportNumber || item.id, item]));
    result.items = result.items.map((item) => {
      const saved = byReport.get(item.reportNumber);
      return { ...item, allTypes: saved?.allTypes, typesFetchedAt: saved?.typesFetchedAt };
    });
    result.catalogBuiltAt = catalog.builtAt;
  }
  if (result.items.length !== result.total) throw new Error("전체 검색 결과가 누락되어 다운로드를 중단했습니다. 다시 검색해주세요.");
  return result;
}

export function sendHealthProductExport(response, result) {
  // 전체 목록도 서버리스 응답 크기 안에서 전송하고, 엑셀은 기존 브라우저 생성기를 사용한다.
  const body = gzipSync(JSON.stringify(result));
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Content-Encoding", "gzip");
  response.setHeader("Content-Length", String(body.length));
  response.statusCode = 200;
  response.end(body);
}
