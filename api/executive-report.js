import { createExecutiveReportPdf } from "../src/executiveReport.js";

export const config = { maxDuration: 300 };

export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });
  try {
    const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body || {};
    const pdf = await createExecutiveReportPdf(body);
    response.setHeader("Content-Type", "application/pdf");
    response.setHeader("Content-Disposition", 'attachment; filename="health-market-report.pdf"');
    return response.status(200).send(Buffer.from(pdf));
  } catch (error) {
    return response.status(400).json({ error: error.message || "Executive report generation failed." });
  }
}
