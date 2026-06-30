const DATALAB_URL = "https://datalab.naver.com/shoppingInsight/sCategory.naver";
export async function fetchPopularKeywordsWithBrowser(input) {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.goto(DATALAB_URL, { waitUntil: "domcontentloaded", timeout: 30000 });

    const rows = [];
    const totalPages = Math.ceil((input.limit || 500) / 20);

    for (let pageNo = 1; pageNo <= totalPages; pageNo += 1) {
      const ranks = await page.evaluate(async ({ category, startDate, endDate, pageNo }) => {
        const body = new URLSearchParams({
          cid: category,
          timeUnit: "date",
          startDate,
          endDate,
          page: String(pageNo),
          count: "20"
        });
        const response = await fetch("/shoppingInsight/getCategoryKeywordRank.naver", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest"
          },
          body
        });
        const text = await response.text();

        try {
          return JSON.parse(text).ranks || [];
        } catch {
          const plainText = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
          throw new Error(`네이버 Top 500 응답이 JSON이 아닙니다. ${plainText.slice(0, 240)}`);
        }
      }, {
        category: input.category,
        startDate: input.startDate,
        endDate: input.endDate,
        pageNo
      });

      if (!ranks.length) {
        throw new Error(`No popular keywords returned from Naver DataLab page ${pageNo}.`);
      }

      rows.push(...ranks.map((item, index) => ({
        rank: (pageNo - 1) * 20 + index + 1,
        keyword: item.keyword
      })));
    }

    return rows.slice(0, input.limit || 500);
  } finally {
    await browser.close();
  }
}

async function launchBrowser() {
  if (process.env.VERCEL || process.env.AWS_REGION) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = await import("puppeteer-core");
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });
  }

  if (process.env.CHROME_EXECUTABLE_PATH) {
    const puppeteer = await import("puppeteer-core");
    return puppeteer.launch({
      executablePath: process.env.CHROME_EXECUTABLE_PATH,
      headless: "new"
    });
  }

  throw new Error("Browser scraper requires Vercel Chromium or CHROME_EXECUTABLE_PATH.");
}
