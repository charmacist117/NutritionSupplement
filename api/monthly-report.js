import { getMonthlyReport, saveMonthlyReport } from "../src/storage.js";

export default async function handler(request, response) {
  if (request.method !== "GET" && request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (request.method === "POST") {
    try {
      const result = await saveMonthlyReport(request.body || {});
      if (!result.saved) {
        return response.status(503).json({
          ok: false,
          error: "Blob 저장소가 연결되지 않아 리포트를 저장할 수 없습니다.",
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
  const report = month ? await getMonthlyReport(month) : null;

  if (!report) {
    return response.status(404).json({ error: "Monthly report not found." });
  }

  response.status(200).json(report);
}
