const scriptUrl = "https://ssl.pstatic.net/static.datalab/202504080910/js/shopping.202504080910.js";
const terms = [
  "getCategoryKeywordRank",
  "getKeywordRank",
  "getCategory",
  "getKeyword",
  "function(t){return",
  "sCategory.naver",
  "keywordRank",
  "rank",
  "pageSize",
  "cid",
  "category",
  "showKeyword",
  "gender",
  "age",
  "getRequestParam",
  "getParamText",
  "onClickSubmit",
  "requestParam.requestParam",
  "timeDimension",
  "startDate",
  "endDate",
  "getCategory.naver?cid"
];

const response = await fetch(scriptUrl);
const text = await response.text();

const snippets = terms.map((term) => {
  const index = text.indexOf(term);

  return {
    term,
    index,
    snippet: index >= 0 ? text.slice(Math.max(0, index - 500), index + 900) : ""
  };
});

const module99Start = text.indexOf("99:function");
const module99EndCandidates = [
  text.indexOf("},100:function", module99Start),
  text.indexOf(",100:function", module99Start)
].filter((index) => index > module99Start);
const module99End = module99EndCandidates.length ? Math.min(...module99EndCandidates) : -1;
const module99 = module99Start >= 0 && module99End >= 0
  ? text.slice(module99Start, module99End)
  : "";

console.log(JSON.stringify({ scriptUrl, length: text.length, module99, snippets }, null, 2));
