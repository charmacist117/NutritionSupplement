import { getMonthlyReport } from "../src/storage.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const month = request.query?.month;
  const report = month ? await getMonthlyReport(month) : null;

  if (!report) {
    return response.status(404).json({ error: "Monthly report not found." });
  }

  response.status(200).json(report);
}
