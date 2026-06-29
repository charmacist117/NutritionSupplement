import { listMonthlyReports } from "../src/storage.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const months = await listMonthlyReports();
  response.status(200).json({ months });
}
