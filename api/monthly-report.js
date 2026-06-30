import { deleteMonthlyReport, getMonthlyReport, saveMonthlyReport } from "../src/storage.js";

export default async function handler(request, response) {
  if (request.method !== "GET" && request.method !== "POST" && request.method !== "DELETE") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (request.method === "POST") {
    try {
      const result = await saveMonthlyReport(request.body || {});
      if (!result.saved) {
        return response.status(503).json({
          ok: false,
          error: "현재 배포에서 Blob 인증 정보를 찾지 못했습니다. Blob Store 연결 후 Vercel에서 다시 배포해주세요.",
          storage: result
        });
      }

      return response.status(200).json({
        ok: true,
        storage: result
      });
    } catch (error) {
      return response.status(400).json({
        ok: false,
        error: error.message || "Report save failed."
      });
    }
  }

  const month = request.query?.month;

  if (request.method === "DELETE") {
    if (!month) {
      return response.status(400).json({ ok: false, error: "삭제할 리포트 기간이 필요합니다." });
    }

    try {
      const result = await deleteMonthlyReport(month);
      if (!result.deleted) {
        return response.status(503).json({
          ok: false,
          error: "현재 배포에서 Blob 인증 정보를 찾지 못했습니다. Blob Store 연결 후 Vercel에서 다시 배포해주세요.",
          storage: result
        });
      }

      return response.status(200).json({
        ok: true,
        storage: result
      });
    } catch (error) {
      return response.status(400).json({
        ok: false,
        error: error.message || "Report delete failed."
      });
    }
  }

  const report = month ? await getMonthlyReport(month) : null;

  if (!report) {
    return response.status(404).json({ error: "Monthly report not found." });
  }

  response.status(200).json(report);
}
