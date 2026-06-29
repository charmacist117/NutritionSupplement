const baseUrl = "https://datalab.naver.com/shoppingInsight";
const headers = {
  "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
  "referer": `${baseUrl}/sCategory.naver`,
  "x-requested-with": "XMLHttpRequest",
  "user-agent": "Mozilla/5.0"
};

async function get(path) {
  const response = await fetch(`${baseUrl}/${path}`, { headers });
  const text = await response.text();
  return { status: response.status, text: text.slice(0, 2000) };
}

async function post(path, body) {
  const response = await fetch(`${baseUrl}/${path}`, {
    method: "POST",
    headers,
    body: new URLSearchParams(body)
  });
  const text = await response.text();
  return { status: response.status, text: text.slice(0, 3000) };
}

const results = {
  categoryChildren: await get("getCategory.naver?cid=50000006"),
  categoryRankTry1: await post("getCategoryKeywordRank.naver", {
    cid: "50000006",
    timeUnit: "month",
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    page: "1",
    count: "20"
  }),
  categoryRankTry2: await post("getCategoryKeywordRank.naver", {
    cid: "50000006",
    timeDimension: "month",
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    page: "1",
    count: "20"
  }),
  keywordTry1: await post("getKeywordClick.naver", {
    cid: "50000006",
    timeUnit: "date",
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    keyword: "오메가3"
  })
};

console.log(JSON.stringify(results, null, 2));
