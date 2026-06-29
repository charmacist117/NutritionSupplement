import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectMonthlyNutritionKeywords, previousMonthRange } from "../src/monthlyCollector.js";

const rootDir = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const outputDir = join(rootDir, "data", "monthly");
const popularKeywordFile = process.argv.find((arg) => arg.startsWith("--keywords="))?.slice("--keywords=".length);

const result = await collectMonthlyNutritionKeywords({
  range: previousMonthRange(),
  outputDir,
  popularKeywordFile
});

console.log(JSON.stringify({
  month: result.month,
  category: result.category,
  anchor: result.anchor.keyword,
  count: result.count,
  outputDir
}, null, 2));
