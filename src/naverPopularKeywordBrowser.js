const DATALAB_URL = "https://datalab.naver.com/shoppingInsight/sCategory.naver";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export async function fetchPopularKeywordsWithBrowser(input) {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await preparePage(page);
    await page.goto(`${DATALAB_URL}?cid=${encodeURIComponent(input.category)}`, {
      waitUntil: "domcontentloaded",
      timeout: 45000
    });
    await waitForNaverPage(page);

    try {
      return await fetchPopularKeywordsWithPageAjax(page, input);
    } catch (ajaxError) {
      return await fetchPopularKeywordsWithVueFallback(page, input, ajaxError);
    }
  } finally {
    await browser.close();
  }
}

async function fetchPopularKeywordsWithPageAjax(page, input) {
  const rows = [];
  const limit = input.limit || 500;
  const totalPages = Math.ceil(limit / 20);

  for (let pageNo = 1; pageNo <= totalPages; pageNo += 1) {
    const response = await page.evaluate((params) => {
      const data = {
        cid: params.category,
        timeUnit: "date",
        startDate: params.startDate,
        endDate: params.endDate,
        device: "",
        gender: "",
        age: "",
        page: String(params.pageNo),
        count: "20"
      };

      const normalizeText = (value) => typeof value === "string" ? value : JSON.stringify(value);

      if (window.jQuery?.ajax) {
        return new Promise((resolve) => {
          window.jQuery.ajax({
            url: "getCategoryKeywordRank.naver",
            method: "POST",
            data,
            dataType: "text",
            timeout: 20000,
            success: (text, _status, xhr) => resolve({
              ok: true,
              status: xhr?.status || 200,
              contentType: xhr?.getResponseHeader?.("content-type") || "",
              text: normalizeText(text)
            }),
            error: (xhr, statusText, errorText) => resolve({
              ok: false,
              status: xhr?.status || 0,
              contentType: xhr?.getResponseHeader?.("content-type") || "",
              text: normalizeText(xhr?.responseText || errorText || statusText || "")
            })
          });
        });
      }

      return fetch("getCategoryKeywordRank.naver", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Accept": "application/json, text/javascript, */*; q=0.01",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: new URLSearchParams(data)
      }).then(async (fetchResponse) => ({
        ok: fetchResponse.ok,
        status: fetchResponse.status,
        contentType: fetchResponse.headers.get("content-type") || "",
        text: await fetchResponse.text()
      }));
    }, {
      category: String(input.category),
      startDate: input.startDate,
      endDate: input.endDate,
      pageNo
    });

    const ranks = parseRankResponse(response, pageNo);
    rows.push(...ranks.map((item, index) => ({
      rank: (pageNo - 1) * 20 + index + 1,
      keyword: item.keyword
    })));
  }

  return rows.slice(0, limit);
}

async function fetchPopularKeywordsWithVueFallback(page, input, originalError) {
  try {
    return await fetchPopularKeywordsFromVue(page, input);
  } catch (fallbackError) {
    throw withCause(fallbackError, originalError);
  }
}

async function fetchPopularKeywordsFromVue(page, input) {
  const limit = input.limit || 500;
  const totalPages = Math.ceil(limit / 20);
  const triggered = await page.evaluate(({ category, startDate, endDate }) => {
    const component = findVueComponent((item) => item.pageType === "category" && item.requestParam && typeof item.onClickSubmit === "function");
    if (!component) return false;

    const dateLike = (value) => ({
      format: (formatText = "YYYY-MM-DD") => formatText.includes(".") ? value.replaceAll("-", ".") : value
    });

    component.triggerSubmit = false;
    component.requestParam.cid = Number(category);
    component.requestParam.device = [];
    component.requestParam.gender = [];
    component.requestParam.age = [];
    component.requestParam.period = {
      timeDimension: "date",
      from: startDate,
      to: endDate,
      dateFrom: dateLike(startDate),
      dateTo: dateLike(endDate)
    };
    component.categoryData = {
      cid: Number(category),
      name: "건강식품",
      fullPath: "식품 > 건강식품"
    };
    component.onClickSubmit();
    return true;

    function findVueComponent(predicate) {
      const roots = Array.from(document.querySelectorAll("*"))
        .map((element) => element.__vue__)
        .filter(Boolean);
      const queue = roots.slice();
      const seen = new Set();

      while (queue.length) {
        const current = queue.shift();
        if (!current || seen.has(current)) continue;
        seen.add(current);
        if (predicate(current)) return current;
        queue.push(...(current.$children || []));
      }

      return null;
    }
  }, {
    category: String(input.category),
    startDate: input.startDate,
    endDate: input.endDate
  });

  if (!triggered) {
    throw new Error("네이버 페이지의 조회 컴포넌트를 찾지 못했습니다.");
  }

  await waitForRankComponent(page, 1);

  const rows = [];
  for (let pageNo = 1; pageNo <= totalPages; pageNo += 1) {
    const ranks = await readRankComponent(page);
    if (!ranks.length) {
      throw new Error(`네이버 Top 500 ${pageNo}페이지 목록이 비어 있습니다.`);
    }

    rows.push(...ranks.map((item, index) => ({
      rank: (pageNo - 1) * 20 + index + 1,
      keyword: item.keyword
    })));

    if (pageNo < totalPages) {
      await page.evaluate(() => {
        const component = findRankComponent();
        component.onClickNext({ target: { className: "" } });

        function findRankComponent() {
          const roots = Array.from(document.querySelectorAll("*"))
            .map((element) => element.__vue__)
            .filter(Boolean);
          const queue = roots.slice();
          const seen = new Set();

          while (queue.length) {
            const current = queue.shift();
            if (!current || seen.has(current)) continue;
            seen.add(current);
            if (Array.isArray(current.keywordList) && typeof current.onClickNext === "function") return current;
            queue.push(...(current.$children || []));
          }

          throw new Error("네이버 인기검색어 페이지 컴포넌트를 찾지 못했습니다.");
        }
      });
      await waitForRankComponent(page, pageNo + 1);
    }
  }

  return rows.slice(0, limit);
}

async function readRankComponent(page) {
  return page.evaluate(() => {
    const component = findRankComponent();
    return (component.keywordList || []).map((item) => ({
      keyword: item.keyword || item.name || String(item)
    })).filter((item) => item.keyword);

    function findRankComponent() {
      const roots = Array.from(document.querySelectorAll("*"))
        .map((element) => element.__vue__)
        .filter(Boolean);
      const queue = roots.slice();
      const seen = new Set();

      while (queue.length) {
        const current = queue.shift();
        if (!current || seen.has(current)) continue;
        seen.add(current);
        if (Array.isArray(current.keywordList) && typeof current.onClickNext === "function") return current;
        queue.push(...(current.$children || []));
      }

      return { keywordList: [] };
    }
  });
}

async function waitForRankComponent(page, pageNo) {
  await page.waitForFunction((expectedPage) => {
    const component = findRankComponent();
    return component && component.page === expectedPage && Array.isArray(component.keywordList) && component.keywordList.length > 0;

    function findRankComponent() {
      const roots = Array.from(document.querySelectorAll("*"))
        .map((element) => element.__vue__)
        .filter(Boolean);
      const queue = roots.slice();
      const seen = new Set();

      while (queue.length) {
        const current = queue.shift();
        if (!current || seen.has(current)) continue;
        seen.add(current);
        if (Array.isArray(current.keywordList) && typeof current.onClickNext === "function") return current;
        queue.push(...(current.$children || []));
      }

      return null;
    }
  }, { timeout: 25000 }, pageNo);
}

function parseRankResponse(response, pageNo) {
  const text = String(response?.text || "");
  const parsed = tryJson(text);

  if (!response?.ok || !parsed?.ranks) {
    const snippet = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
    throw new Error(`네이버 Top 500 ${pageNo}페이지 응답이 JSON이 아닙니다. status=${response?.status || 0}, content-type=${response?.contentType || "unknown"}${snippet ? `, body=${snippet}` : ""}`);
  }

  if (!parsed.ranks.length) {
    throw new Error(`네이버 Top 500 ${pageNo}페이지에 검색어가 없습니다.`);
  }

  return parsed.ranks;
}

async function preparePage(page) {
  await page.setUserAgent(USER_AGENT);
  await page.setViewport({ width: 1365, height: 900, deviceScaleFactor: 1 });
  await page.setExtraHTTPHeaders({
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7"
  });
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    Object.defineProperty(navigator, "languages", { get: () => ["ko-KR", "ko", "en-US", "en"] });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
  });
}

async function waitForNaverPage(page) {
  await page.waitForFunction(() => document.readyState === "complete", { timeout: 20000 }).catch(() => {});
  await page.waitForFunction(() => window.jQuery?.ajax || window.$?.ajax || document.querySelector("[data-cid]"), { timeout: 20000 }).catch(() => {});
  await new Promise((resolve) => setTimeout(resolve, 1500));
}

async function launchBrowser() {
  const commonArgs = [
    "--disable-blink-features=AutomationControlled",
    "--lang=ko-KR,ko"
  ];

  if (process.env.VERCEL || process.env.AWS_REGION) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = await import("puppeteer-core");
    return puppeteer.launch({
      args: [...chromium.args, ...commonArgs],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });
  }

  if (process.env.CHROME_EXECUTABLE_PATH) {
    const puppeteer = await import("puppeteer-core");
    return puppeteer.launch({
      args: commonArgs,
      executablePath: process.env.CHROME_EXECUTABLE_PATH,
      headless: "new"
    });
  }

  throw new Error("Browser scraper requires Vercel Chromium or CHROME_EXECUTABLE_PATH.");
}

function tryJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function withCause(error, cause) {
  error.message = `${error.message} 최초 오류: ${cause.message}`;
  return error;
}
