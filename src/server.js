import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { collectMonthlyNutritionKeywords, previousMonthRange } from "./monthlyCollector.js";
import { fetchKeywordTrends, getNaverCredentials, NaverShoppingInsightError } from "./naverShoppingInsight.js";
import { getMonthlyReport, listMonthlyReports } from "./storage.js";

const rootDir = normalize(join(fileURLToPath(new URL(".", import.meta.url)), ".."));
const publicDir = join(rootDir, "public");

loadLocalEnv();

const port = Number(process.env.PORT || 3010);

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/api/health") {
      return sendJson(response, 200, {
        ok: true,
        naverConfigured: Boolean(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET)
      });
    }

    if (request.method === "POST" && (url.pathname === "/api/shopping/keywords" || url.pathname === "/api/shopping-keywords")) {
      const body = await readJson(request);
      const result = await fetchKeywordTrends(body, getNaverCredentials());

      return sendJson(response, 200, result);
    }

    if (request.method === "POST" && url.pathname === "/api/collect-monthly") {
      const body = await readJson(request);
      const result = await collectMonthlyNutritionKeywords({
        range: body.range || previousMonthRange(),
        outputDir: join(rootDir, "data", "monthly"),
        popularKeywordFile: body.popularKeywordFile
      });

      return sendJson(response, 200, result);
    }

    if (request.method === "GET" && url.pathname === "/api/monthly-reports") {
      const months = await listMonthlyReports({ outputDir: join(rootDir, "data", "monthly") });
      return sendJson(response, 200, { months });
    }

    if (request.method === "GET" && url.pathname === "/api/monthly-report") {
      const report = await getMonthlyReport(url.searchParams.get("month") || "", {
        outputDir: join(rootDir, "data", "monthly")
      });
      return report ? sendJson(response, 200, report) : sendJson(response, 404, { error: "Monthly report not found." });
    }

    if (request.method === "GET") {
      return serveStatic(request, response);
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    handleError(response, error);
  }
});

server.listen(port, () => {
  console.log(`NutritionSupplement server running at http://localhost:${port}`);
});

async function readJson(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const text = Buffer.concat(chunks).toString("utf8");

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new NaverShoppingInsightError("Request body must be valid JSON.", 400);
  }
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const routePath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = normalize(join(publicDir, decodeURIComponent(routePath)));

  if (!filePath.startsWith(publicDir)) {
    return sendJson(response, 403, { error: "Forbidden" });
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, { "Content-Type": contentType(filePath) });
    response.end(content);
  } catch {
    sendJson(response, 404, { error: "Not found" });
  }
}

function handleError(response, error) {
  if (error instanceof NaverShoppingInsightError) {
    return sendJson(response, error.status, {
      error: error.message,
      details: error.details
    });
  }

  console.error(error);
  sendJson(response, 500, { error: "Internal server error" });
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload, null, 2));
}

function contentType(filePath) {
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8"
  };

  return types[extname(filePath)] || "application/octet-stream";
}

function loadLocalEnv() {
  const envPath = join(rootDir, ".env");

  readFile(envPath, "utf8")
    .then((content) => {
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        const index = trimmed.indexOf("=");
        if (index === -1) continue;

        const key = trimmed.slice(0, index).trim();
        const value = trimmed.slice(index + 1).trim();
        if (key && process.env[key] === undefined) process.env[key] = value;
      }
    })
    .catch(() => {});
}
