import assert from "node:assert/strict";
import "./checkCategoryAssignments.js";
import "./checkImportedHealthProducts.js";
import { buildComparisonOptions, buildComparisonPeriods, comparisonMethodText } from "../public/comparisonPeriods.js";
import { baseAutoProductCategoryFor, baseAutoProductCategoriesFor, mappingReview, compareMappingPriority, isMappingReviewTarget } from "../public/categoryMappingReview.js";

const months = (start, count) => {
  const [year, month] = start.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => new Date(Date.UTC(year, month - 1 + i, 1)).toISOString().slice(0, 7));
};
const report = (month, rows = [{ rank: 1, keyword: "오메가3" }]) => ({ month, startDate: `${month}-01`,
  endDate: new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0)).toISOString().slice(0, 10), rows });
const keys = months("2025-01", 24);
const options = buildComparisonOptions(keys, "quarter");
assert.equal(options.length, 22);
assert.deepEqual(options.find((option) => option.key === "quarter:2025-02").monthKeys, ["2025-02", "2025-03", "2025-04"]);
assert.deepEqual(options.find((option) => option.key === "quarter:2025-11").monthKeys, ["2025-11", "2025-12", "2026-01"]);
const selected = ["quarter:2025-02", "quarter:2025-07"];
const grouped = buildComparisonPeriods(keys.map((key) => report(key)), "quarter", selected).periods;
assert.deepEqual(grouped.map((period) => [period.startDate, period.endDate, period.sourceMonthCount]),
  [["2025-02-01", "2025-04-30", 3], ["2025-07-01", "2025-09-30", 3]]);
assert.equal(buildComparisonPeriods(months("2025-02", 4).map((key) => report(key)), "quarter", ["quarter:2025-02", "quarter:2025-03"]).periods.length, 2);
assert.equal(buildComparisonOptions(months("2025-02", 6), "half")[0].endDate, "2025-07-31");
assert.equal(buildComparisonOptions(months("2025-08", 6), "half")[0].endDate, "2026-01-31");
assert.equal(buildComparisonOptions(months("2025-05", 12), "rollingYear")[0].endDate, "2026-04-30");
assert.equal(buildComparisonOptions(months("2025-05", 12), "year").length, 0);
assert.deepEqual(buildComparisonOptions(keys, "year").map((option) => option.startDate), ["2025-01-01", "2026-01-01"]);
assert.equal(buildComparisonOptions(months("2024-01", 3), "quarter")[0].monthKeys[1], "2024-02");
assert.equal(buildComparisonPeriods(months("2023-12", 3).map((key) => report(key)), "quarter").periods[0].endDate, "2024-02-29");
assert.equal(buildComparisonOptions(["2025-02", "2025-04", "2025-05"], "quarter").length, 0);
assert.equal(buildComparisonOptions(["2025-02-01_2025-02-28", "2025-03", "2025-04"], "quarter").length, 1);
assert.equal(buildComparisonOptions(["2025-02-02_2025-02-28", "2025-03", "2025-04"], "quarter").length, 0);
assert.equal(buildComparisonOptions(["2025-02", "2025-02-01_2025-02-28", "2025-03", "2025-04"], "quarter").length, 1);
const partial = report("2025-03"); partial.startDate = "2025-03-02";
assert.equal(buildComparisonPeriods([report("2025-02"), partial, report("2025-04")], "quarter", ["quarter:2025-02"]).periods.length, 0);
const ranked = buildComparisonPeriods([
  report("2025-02", [{ rank: 1, keyword: "상시" }, { rank: 2, keyword: "드문 키워드" }]),
  report("2025-03", [{ rank: 3, keyword: "상시" }]),
  report("2025-04", [{ rank: 2, keyword: "상시" }])
], "quarter").periods[0];
assert.equal(ranked.rows[0].keyword, "상시");
assert.equal(ranked.rows[0].averageMonthlyRank, 2);
assert.equal(ranked.rows[1].averageMonthlyRank, 334.667);
assert.equal(buildComparisonPeriods([report("2025-02"), report("2025-01")], "month").periods[0].month, "2025-01");
assert.match(comparisonMethodText("year"), /1~12월/);
assert.match(comparisonMethodText("rollingYear"), /연속 12개월/);

assert.equal(baseAutoProductCategoryFor("비타민 C"), "비타민c");
assert.equal(baseAutoProductCategoryFor("구강 유산균"), "구강 건강");
assert.equal(baseAutoProductCategoryFor("오메가3 마그네슘"), "오메가3");
assert.deepEqual(baseAutoProductCategoriesFor("오메가3 마그네슘"), ["오메가3", "마그네슘"]);
assert.equal(mappingReview([], ["기타"]).label, "분류 필요");
assert.equal(mappingReview([], ["오메가3", "마그네슘"]).label, "복수 후보");
assert.equal(mappingReview([], ["오메가3"]).label, "추천 확인");
assert.equal(mappingReview(["기타"], ["기타"]).label, "재분류 필요");
assert.equal(mappingReview(["오메가3"], ["오메가3", "마그네슘"]).needsReview, false);
assert.equal(mappingReview([], ["관절 건강", "관절 건강"]).needsReview, false);
const queue = [
  { keyword: "완료", review: mappingReview(["오메가3"], ["오메가3"]), latestRank: 1 },
  { keyword: "단일 추천", review: mappingReview([], ["오메가3"]), latestRank: 1 },
  { keyword: "복수 후보", review: mappingReview([], ["오메가3", "마그네슘"]), latestRank: 1 },
  { keyword: "예전 미분류", review: mappingReview([], ["기타"]), latestEndDate: "2025-01-31", latestRank: 1 },
  { keyword: "최신 미분류", review: mappingReview([], ["미지정"]), latestEndDate: "2026-10-31", latestRank: 100 }
].sort(compareMappingPriority);
assert.deepEqual(queue.map((row) => row.keyword), ["최신 미분류", "예전 미분류", "복수 후보", "단일 추천", "완료"]);
for (const category of ["불분명", "기타", "브랜드", "브랜드명", "미지정", "미분류", "미확정"]) {
  const pending = { review: mappingReview([category], ["오메가3"]), appearanceType: "" };
  assert.equal(pending.review.pendingCategory, true, category);
  assert.equal(isMappingReviewTarget(pending), true, `예전 ${category}도 계속 검토 대상`);
}
assert.equal(mappingReview(["오메가3", "불분명"], ["오메가3"]).needsReview, true);
assert.equal(isMappingReviewTarget({ review: mappingReview(["오메가3"], ["오메가3"]), appearanceType: "first" }), false);
const persistentQueue = [
  { keyword: "기존 브랜드", review: mappingReview(["브랜드"], ["기타"]), latestEndDate: "2025-01-31" },
  { keyword: "분류 완료 신규", review: mappingReview(["오메가3"], ["오메가3"]), appearanceType: "first" },
  { keyword: "기존 복수 후보", review: mappingReview([], ["오메가3", "마그네슘"]), latestEndDate: "2026-10-31" },
  { keyword: "자동 기타", review: mappingReview([], ["기타"]), latestEndDate: "2026-10-31" },
  { keyword: "미확정 신규", review: mappingReview([], ["오메가3"]), appearanceType: "first", latestRank: 500 },
  { keyword: "미확정 재진입", review: mappingReview([], ["마그네슘"]), appearanceType: "returning", latestRank: 10 }
].sort(compareMappingPriority);
assert.deepEqual(persistentQueue.map((row) => row.keyword), ["미확정 재진입", "미확정 신규", "기존 브랜드", "자동 기타", "기존 복수 후보", "분류 완료 신규"]);
assert.deepEqual(persistentQueue.filter(isMappingReviewTarget).map((row) => row.keyword), ["미확정 재진입", "미확정 신규", "기존 브랜드", "자동 기타", "기존 복수 후보"]);
console.log("arbitrary month ranges, ranking aggregation and category review priority checks ok");
