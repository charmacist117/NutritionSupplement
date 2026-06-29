const baseUrl = "https://datalab.naver.com/shoppingInsight";
const headers = {
  "Accept": "application/json, text/javascript, */*; q=0.01",
  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  "Referer": `${baseUrl}/sCategory.naver`,
  "User-Agent": "Mozilla/5.0",
  "X-Requested-With": "XMLHttpRequest"
};

const landing = await fetch(`${baseUrl}/sCategory.naver`, {
  headers: {
    "User-Agent": headers["User-Agent"]
  }
});
const cookie = landing.headers.getSetCookie?.().map((item) => item.split(";")[0]).join("; ")
  || landing.headers.get("set-cookie")?.split(",").map((item) => item.split(";")[0]).join("; ")
  || "";

const body = new URLSearchParams({
  cid: "50000023",
  timeUnit: "month",
  startDate: "2026-05-01",
  endDate: "2026-05-31",
  page: "1",
  count: "20"
});

const response = await fetch(`${baseUrl}/getCategoryKeywordRank.naver`, {
  method: "POST",
  headers: {
    ...headers,
    Cookie: cookie
  },
  body
});

const text = await response.text();
console.log(JSON.stringify({
  landingStatus: landing.status,
  cookie,
  status: response.status,
  contentType: response.headers.get("content-type"),
  text: text.slice(0, 2000)
}, null, 2));
