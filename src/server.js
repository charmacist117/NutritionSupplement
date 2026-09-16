import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { collectMonthlyNutritionKeywords, normalizeCollectionRange, previousMonthRange } from "./monthlyCollector.js";
import { fetchKeywordTrends, getNaverCredentialCount, getNaverCredentialPool, getNaverCredentialProfiles, NaverShoppingInsightError } from "./naverShoppingInsight.js";
import { deleteMonthlyReport, getHealthFunctionalIngredients, getHealthProductDetailChunk, getHealthProductsIndex, getKeywordCategoryMappings, getMonthlyReport, getNaverApiSettings, hasBlobCredentials, listMonthlyReports, saveHealthFunctionalIngredients, saveHealthProductDetailChunk, saveHealthProductsIndex, saveKeywordCategoryMappings, saveMonthlyReport, saveNaverApiSettings } from "./storage.js";
import { HEALTH_FOOD_CATEGORY } from "./categories.js";
import { createComparisonReportPdf, createExecutiveReportPdf } from "./executiveReport.js";
import { pageHealthFunctionalIngredients, syncHealthFunctionalIngredients } from "./individualIngredients.js";
import { fetchHealthProductDetails, fetchHealthProductIndex, HEALTH_PRODUCT_CHUNK_SIZE, pageHealthProducts } from "./healthProducts.js";

const rootDir = normalize(join(fileURLToPath(new URL(".", import.meta.url)), ".."));
const publicDir = join(rootDir, "public");

loadLocalEnv();

const port = Number(process.env.PORT || 3010);

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/api/health") {
      const naverCredentialCount = safeNaverCredentialCount();
      const profiles = getNaverCredentialProfiles();
      const settings = await getNaverApiSettings({ outputDir: join(rootDir, "data", "settings") });
      const preferredProfile = settings.activeProfile || String(process.env.NAVER_ACTIVE_PROFILE || "").trim().toLowerCase();
      const activeProfile = profiles.some((item) => item.profile === preferredProfile) ? preferredProfile : profiles[0]?.profile || "";
      return sendJson(response, 200, {
        ok: true,
        naverConfigured: naverCredentialCount > 0,
        naverCredentialCount,
        naverActiveProfile: activeProfile,
        naverActiveProfileLabel: profiles.find((item) => item.profile === activeProfile)?.label || "",
        naverActiveCredentialCount: getNaverCredentialPool(process.env, activeProfile).length,
        blobConfigured: hasBlobCredentials(),
        category: HEALTH_FOOD_CATEGORY
      });
    }

    if (request.method === "POST" && (url.pathname === "/api/shopping/keywords" || url.pathname === "/api/shopping-keywords")) {
      const body = await readJson(request);
      const settings = await getNaverApiSettings({ outputDir: join(rootDir, "data", "settings") });
      const activeProfile = settings.activeProfile || process.env.NAVER_ACTIVE_PROFILE || getNaverCredentialProfiles()[0]?.profile || "";
      const result = await fetchKeywordTrends(body, getNaverCredentialPool(process.env, activeProfile));

      return sendJson(response, 200, result);
    }

    if (request.method === "POST" && url.pathname === "/api/collect-monthly") {
      const body = await readJson(request);
      const range = body.startDate && body.endDate
        ? normalizeCollectionRange({ startDate: body.startDate, endDate: body.endDate })
        : body.range || previousMonthRange();
      const settings = await getNaverApiSettings({ outputDir: join(rootDir, "data", "settings") });
      const activeProfile = settings.activeProfile || process.env.NAVER_ACTIVE_PROFILE || getNaverCredentialProfiles()[0]?.profile || "";
      const result = await collectMonthlyNutritionKeywords({
        range,
        credentials: getNaverCredentialPool(process.env, activeProfile),
        outputDir: join(rootDir, "data", "monthly"),
        popularKeywordFile: body.popularKeywordFile
      });

      return sendJson(response, 200, result);
    }

    if (url.pathname === "/api/naver-api-settings") {
      const options = { outputDir: join(rootDir, "data", "settings") };
      const profiles = getNaverCredentialProfiles();
      let settings = await getNaverApiSettings(options);
      if (request.method === "PUT") {
        const body = await readJson(request);
        const activeProfile = String(body.activeProfile || "").trim().toLowerCase();
        if (!profiles.some((item) => item.profile === activeProfile)) return sendJson(response, 400, { error: "등록되지 않은 네이버 API 프로필입니다." });
        settings = await saveNaverApiSettings({ activeProfile }, options);
      }
      if (["GET", "PUT"].includes(request.method)) {
        const preferredProfile = settings.activeProfile || String(process.env.NAVER_ACTIVE_PROFILE || "").trim().toLowerCase();
        const activeProfile = profiles.some((item) => item.profile === preferredProfile) ? preferredProfile : profiles[0]?.profile || "";
        return sendJson(response, 200, { activeProfile, updatedAt: settings.updatedAt, profiles, secretStorage: "environment-variables" });
      }
    }

    if (request.method === "POST" && url.pathname === "/api/executive-report") {
      const body = await readJson(request);
      const pdf = await createExecutiveReportPdf(body);
      response.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="health-market-report.pdf"',
        "Content-Length": pdf.length
      });
      return response.end(pdf);
    }

    if (url.pathname === "/api/individual-ingredients") {
      const options = { outputDir: join(rootDir, "data", "ingredients") };
      if (request.method === "GET") {
        const saved = await getHealthFunctionalIngredients(options);
        return saved
          ? sendJson(response, 200, pageHealthFunctionalIngredients(saved, { page: url.searchParams.get("page"), query: url.searchParams.get("q") }))
          : sendJson(response, 404, { error: "저장된 원료 자료가 없습니다. 전체 동기화를 실행해주세요." });
      }
      if (request.method === "POST") {
        const synced = await syncHealthFunctionalIngredients();
        const storage = await saveHealthFunctionalIngredients(synced, options);
        return storage.saved
          ? sendJson(response, 200, { ...pageHealthFunctionalIngredients(synced), storage })
          : sendJson(response, 503, { error: "Blob 저장소가 연결되어야 원료 자료를 저장할 수 있습니다.", storage });
      }
    }

    if (url.pathname === "/api/health-products") {
      const options = { outputDir: join(rootDir, "data", "health-products") };
      if (request.method === "GET") {
        const index = await getHealthProductsIndex(options);
        if (!index) return sendJson(response, 404, { error: "저장된 건강기능식품 제품 자료가 없습니다. 전체 수집을 시작해주세요." });
        const params = { page: url.searchParams.get("page"), includes: url.searchParams.get("includes"), excludes: url.searchParams.get("excludes") };
        const first = pageHealthProducts(index, [], params);
        const chunks = [...new Set(first.items.filter((item) => item.index < index.detailTotal).map((item) => Math.floor(item.index / HEALTH_PRODUCT_CHUNK_SIZE)))];
        const details = (await Promise.all(chunks.map((number) => getHealthProductDetailChunk(number, options)))).flat();
        return sendJson(response, 200, pageHealthProducts(index, details, params));
      }
      if (request.method === "POST") {
        const body = await readJson(request);
        let index = body.reset ? null : await getHealthProductsIndex(options);
        if (!index) {
          index = await fetchHealthProductIndex();
          const storage = await saveHealthProductsIndex(index, options);
          if (!storage.saved) return sendJson(response, 503, { error: "Blob 저장소가 연결되어야 제품 자료를 저장할 수 있습니다.", storage });
          return sendJson(response, 200, { total: index.total, detailTotal: 0, complete: index.complete, progress: 0, syncedAt: index.syncedAt, updatedAt: null });
        }
        if (!index.complete) {
          const start = Number(index.nextDetailIndex || 0);
          const fetched = await fetchHealthProductDetails(index.items.slice(start, start + 60));
          const grouped = new Map();
          fetched.forEach((item, offset) => {
            const number = Math.floor((start + offset) / HEALTH_PRODUCT_CHUNK_SIZE);
            if (!grouped.has(number)) grouped.set(number, []);
            grouped.get(number).push(item);
          });
          for (const [number, items] of grouped) {
            const current = await getHealthProductDetailChunk(number, options);
            const byId = new Map(current.map((item) => [item.id, item]));
            items.forEach((item) => byId.set(item.id, item));
            await saveHealthProductDetailChunk(number, [...byId.values()], options);
          }
          index.nextDetailIndex = start + fetched.length;
          index.detailTotal = index.nextDetailIndex;
          index.complete = index.detailTotal >= index.total;
          index.updatedAt = new Date().toISOString();
          await saveHealthProductsIndex(index, options);
        }
        return sendJson(response, 200, {
          total: index.total, detailTotal: index.detailTotal, complete: index.complete,
          progress: index.total ? Math.floor(index.detailTotal / index.total * 1000) / 10 : 0,
          syncedAt: index.syncedAt, updatedAt: index.updatedAt || null
        });
      }
    }

    if (request.method === "POST" && url.pathname === "/api/comparison-report") {
      const body = await readJson(request);
      const pdf = await createComparisonReportPdf(body);
      response.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="shopping-insight-comparison.pdf"',
        "Content-Length": pdf.length
      });
      return response.end(pdf);
    }

    if (request.method === "GET" && url.pathname === "/api/monthly-reports") {
      const months = await listMonthlyReports({ outputDir: join(rootDir, "data", "monthly") });
      return sendJson(response, 200, { months });
    }

    if (url.pathname === "/api/monthly-report") {
      const options = { outputDir: join(rootDir, "data", "monthly") };
      if (request.method === "GET") {
        const report = await getMonthlyReport(url.searchParams.get("month") || "", options);
        return report ? sendJson(response, 200, report) : sendJson(response, 404, { error: "Period report not found." });
      }

      if (request.method === "POST") {
        const body = await readJson(request);
        const storage = await saveMonthlyReport(body, options);
        return storage.saved
          ? sendJson(response, 200, { ok: true, storage })
          : sendJson(response, 503, { ok: false, error: "현재 배포에서 Blob 인증 정보를 찾지 못했습니다. Blob Store 연결 후 Vercel에서 다시 배포해주세요.", storage });
      }

      if (request.method === "DELETE") {
        const storage = await deleteMonthlyReport(url.searchParams.get("month") || "", options);
        return storage.deleted
          ? sendJson(response, 200, { ok: true, storage })
          : sendJson(response, 503, { ok: false, error: "현재 배포에서 Blob 인증 정보를 찾지 못했습니다. Blob Store 연결 후 Vercel에서 다시 배포해주세요.", storage });
      }
    }

    if (url.pathname === "/api/keyword-category-mappings") {
      const options = { outputDir: join(rootDir, "data", "settings") };
      if (request.method === "GET") {
        const mappings = await getKeywordCategoryMappings(options);
        return sendJson(response, 200, mappings);
      }

      if (request.method === "POST") {
        const body = await readJson(request);
        const saved = await saveKeywordCategoryMappings(body, options);
        return sendJson(response, 200, saved);
      }
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
  sendJson(response, 500, {
    error: error.message || "Internal server error",
    details: error.stack ? error.stack.split("\n").slice(0, 3).join("\n") : null
  });
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

  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function safeNaverCredentialCount() {
  try {
    return getNaverCredentialCount();
  } catch {
    return 0;
  }
}
