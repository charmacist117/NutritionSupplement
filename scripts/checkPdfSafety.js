import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { createComparisonReportPdf, createExecutiveReportPdf } from "../src/executiveReport.js";

let requests = 0;
const server = createServer((request, response) => { requests++; response.writeHead(404).end(); });
server.listen(0, "127.0.0.1");
await once(server, "listening");
const pageCount = (pdf) => Number(Buffer.from(pdf).toString("latin1").match(/\/Type \/Pages\b[\s\S]*?\/Count (\d+)/)?.[1]);
try {
  const pdf = await createComparisonReportPdf({
    html: `<p>Comparison report</p><img src="http://127.0.0.1:${server.address().port}/probe" onerror="document.body.style.height='4000px'">`
  });
  assert.equal(requests, 0, "The PDF renderer must not contact any network address.");
  assert.equal(pageCount(pdf), 1, "An event handler must not be able to change the document.");
  const row = { keyword: "복합제품", rank: 1, categories: ["오메가3", "마그네슘", "유산균", "비타민c", "기타"] };
  const report = (month, end) => ({ startDate: month + "-01", endDate: month + end, rows: [row] });
  const executive = await createExecutiveReportPdf({
    baselineReports: [report("2026-09", "-30")], currentReports: [report("2026-10", "-31")]
  });
  assert.equal(pageCount(executive), 7);
  assert.equal(requests, 0);
} finally {
  server.close();
}
console.log("PDF browser checks ok: no network, no event execution, seven-page executive report");
