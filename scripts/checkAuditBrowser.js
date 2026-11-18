import assert from "node:assert/strict";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve } from "node:path";
import puppeteer from "puppeteer-core";
import { handleAdminSession } from "../src/adminAuth.js";

const executablePath = process.env.CHROME_EXECUTABLE_PATH || [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
].find(existsSync);
if (!executablePath) throw new Error("브라우저 검사에 CHROME_EXECUTABLE_PATH가 필요합니다.");
const previousPassword = process.env.ADMIN_PASSWORD;
const previousVercel = process.env.VERCEL;
process.env.ADMIN_PASSWORD = "browser-test-password-12345";
delete process.env.VERCEL;
const publicRoot = resolve("public");
const server = createServer(async (request, response) => {
  try {
    const path = new URL(request.url, "http://localhost").pathname;
    if (path === "/api/admin-session") {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      request.body = chunks.length ? JSON.parse(Buffer.concat(chunks)) : {};
      return handleAdminSession(request, {
        setHeader: (name, value) => response.setHeader(name, value),
        status(code) { response.statusCode = code; return this; },
        json(body) { response.setHeader("Content-Type", "application/json"); response.end(JSON.stringify(body)); }
      });
    }
    const file = resolve(publicRoot, path === "/" ? "index.html" : path.slice(1));
    if (!file.startsWith(publicRoot + "/") && !file.startsWith(publicRoot + "\\")) {
      response.writeHead(403).end(); return;
    }
    const content = await readFile(file);
    response.setHeader("Content-Type", {
      ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".css": "text/css"
    }[extname(file)]);
    response.end(content);
  } catch { response.writeHead(404).end(); }
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
const root = `http://127.0.0.1:${server.address().port}`;
try {
  for (const mode of ["load-failure", "save-pending", "missing-period", "order-conflict"]) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let failLoad = mode === "load-failure";
    let saved = { revision: "v1", categories: ["오메가3", "마그네슘", "기타"],
      categoryAliases: {}, mappings: [{ keyword: "검증키워드", category: "오메가3", categories: ["오메가3"] }] };
    let posted = null;
    let pdfCalls = 0;
    let release;
    const pending = new Promise((resolve) => { release = resolve; });
    await page.setRequestInterception(true);
    page.on("request", async (request) => {
      const url = new URL(request.url());
      const json = (body, status = 200) => request.respond({ status, contentType: "application/json; charset=utf-8", body: JSON.stringify(body) });
      if (url.pathname === "/api/health") return json({ naverConfigured: true, blobConfigured: true });
      if (url.pathname === "/api/keyword-category-mappings") {
        if (request.method() === "POST") {
          posted = JSON.parse(request.postData());
          if (mode === "save-pending") await pending;
          if (mode === "order-conflict") return json({ error: "다른 탭에서 변경했습니다." }, 409);
          saved = { ...posted, revision: "v2" };
        }
        return failLoad ? json({ error: "temporary failure" }, 500) : json(saved);
      }
      if (url.pathname === "/api/monthly-reports") return json({ months: ["2026-10", "2026-09", "2026-08"] });
      if (url.pathname === "/api/monthly-report") {
        const month = url.searchParams.get("month");
        if (mode === "missing-period" && month === "2026-08") return json({ error: "unavailable" }, 503);
        return json({ month, startDate: month + "-01", endDate: month + (month === "2026-09" ? "-30" : "-31"),
          count: 1, rows: [{ keyword: "검증키워드", rank: 1, dailyAverageRatio: 1 }] });
      }
      if (url.pathname === "/api/executive-report") { pdfCalls++; return json({ error: "unexpected request" }, 400); }
      return request.continue();
    });
    await page.goto(root, { waitUntil: "networkidle0" });
    await page.locator("#admin-password").fill(process.env.ADMIN_PASSWORD);
    await page.click("#admin-login");
    await page.waitForFunction(() => document.querySelector("#admin-login-form").hidden);
    if (mode === "missing-period") {
      await page.click('#executive-baseline-periods input[data-report-key="2026-08"]');
      await page.click("#executive-pdf-download");
      await page.waitForFunction(() => document.querySelector("#executive-report-status").textContent.includes("불러오지 못했습니다"));
      assert.equal(pdfCalls, 0);
      assert.match(await page.$eval("#executive-report-status", (element) => element.textContent), /2026-08/);
    } else {
      await page.click('[data-tab="mapping"]');
      if (mode === "load-failure") {
        assert.equal(await page.$eval("#mapping-save-button", (element) => element.disabled), true);
        assert.equal(posted, null);
        failLoad = false;
        await page.click("#mapping-refresh-button");
      }
      await page.select("#mapping-filter", "all");
      await page.waitForSelector("#mapping-body .category-search-input");
      if (mode === "save-pending") {
        await page.click("#mapping-save-button");
        await page.waitForFunction(() => document.querySelector("#mapping-save-button").disabled);
        assert.equal(await page.$eval("#mapping-body input", (element) => element.disabled), true);
        assert.equal(await page.$eval("#mapping-body button", (element) => element.disabled), true);
        assert.equal(await page.$eval("#mapping-refresh-button", (element) => element.disabled), true);
        release();
        await page.waitForFunction(() => document.querySelector("#mapping-status").textContent.includes("저장했습니다."));
        assert.equal(posted.revision, "v1");
        assert.equal(await page.$eval("#mapping-body input", (element) => element.disabled), false);
      }
      if (mode === "order-conflict") {
        await page.click(".category-order summary");
        await page.select("#category-order-list", "기타");
        await page.click('[data-category-move="first"]');
        await page.click("#mapping-save-button");
        await page.waitForFunction(() => document.querySelector("#mapping-status").textContent.includes("다른 탭"));
        assert.equal(await page.$eval("#category-manage-select option", (element) => element.value), "기타");
        assert.equal(posted.revision, "v1");
      }
    }
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`browser regression passed: ${mode}`);
  }
} finally {
  await browser.close();
  server.close();
  if (previousPassword === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = previousPassword;
  if (previousVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = previousVercel;
}
