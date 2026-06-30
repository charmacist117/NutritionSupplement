const pageUrl = "https://datalab.naver.com/shoppingInsight/sCategory.naver";

const pageHtml = await fetch(pageUrl, {
  headers: { "User-Agent": "Mozilla/5.0" }
}).then((response) => response.text());

const scripts = [...pageHtml.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map((match) => match[1]);
const scriptUrl = scripts.find((src) => src.includes("/js/shopping."))
  || "https://ssl.pstatic.net/static.datalab/202504080910/js/shopping.202504080910.js";
const absoluteScriptUrl = scriptUrl.startsWith("http") ? scriptUrl : new URL(scriptUrl, pageUrl).href;

const script = await fetch(absoluteScriptUrl, {
  headers: { "User-Agent": "Mozilla/5.0", Referer: pageUrl }
}).then((response) => response.text());

const needles = [
  "getRequestParam:function",
  "getRequestParam",
  "getCategoryKeywordRank",
  "[\"get\",this.requestParam.pageType,\"keyword\",\"rank\"]",
  "requestParam:{startDate",
  "startDate:",
  "dateFrom.format"
];

for (const needle of needles) {
  const index = script.indexOf(needle);
  console.log(`\n--- ${needle} @ ${index} ---`);
  if (index >= 0) {
    console.log(script.slice(Math.max(0, index - 900), index + 1600));
  }
}
