import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { MAX_CATEGORY_ASSIGNMENTS, normalizeAssignedCategories, categoryMappingRecord } from "../public/categoryAssignments.js";
import { mappingReview } from "../public/categoryMappingReview.js";
import { getKeywordCategoryMappings, saveKeywordCategoryMappings } from "../src/storage.js";

const categories = ["오메가3", "마그네슘", "비타민d", "비타민c", "유산균"];
assert.equal(MAX_CATEGORY_ASSIGNMENTS, 5);
assert.deepEqual(normalizeAssignedCategories(["", " 오메가3 ", "오메가 3", ...categories, "여섯째"]), categories);
assert.equal(mappingReview([...categories.slice(0, 4), "브랜드"], []).pendingCategory, true);
assert.deepEqual(categoryMappingRecord("복합제품", categories).categories, categories);
assert.equal(categoryMappingRecord("복합제품", categories).secondaryCategory, categories[1]);

// Keep this integration check isolated from deployment credentials and actual settings.
const envKeys = ["BLOB_READ_WRITE_TOKEN", "BLOB_STORE_ID", "VERCEL_OIDC_TOKEN", "VERCEL"];
const savedEnv = envKeys.map((key) => [key, process.env[key]]);
for (const key of envKeys) delete process.env[key];
const outputDir = await mkdtemp(join(tmpdir(), "카테고리검증-"));
const options = { outputDir };
try {
  await writeFile(join(outputDir, "keyword-category-mappings.json"), JSON.stringify({
    mappings: [{ keyword: "기존제품", category: categories[0], secondaryCategory: categories[1] }]
  }));
  assert.deepEqual((await getKeywordCategoryMappings(options)).mappings[0].categories, categories.slice(0, 2));
  const payload = { categories, mappings: [categoryMappingRecord("복합제품", [...categories, "여섯째"])] };
  await saveKeywordCategoryMappings(payload, options);
  let loaded = await getKeywordCategoryMappings(options);
  assert.deepEqual(loaded.mappings[0].categories, categories);
  assert.deepEqual(JSON.parse(await readFile(join(outputDir, "keyword-category-mappings.json"), "utf8")).mappings[0].categories, categories);
  const renamed = categories.map((category) => category === "비타민d" ? "비타민 D" : category);
  await saveKeywordCategoryMappings({ mappings: [categoryMappingRecord("복합제품", renamed)] }, options);
  loaded = await getKeywordCategoryMappings(options);
  assert.deepEqual(loaded.mappings[0].categories, renamed);
  const removed = renamed.filter((category) => category !== "마그네슘");
  await saveKeywordCategoryMappings({ mappings: [categoryMappingRecord("복합제품", removed)] }, options);
  assert.deepEqual((await getKeywordCategoryMappings(options)).mappings[0].categories, removed);
} finally {
  for (const [key, value] of savedEnv) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  assert.ok(resolve(outputDir).startsWith(resolve(tmpdir()) + sep));
  assert.ok(outputDir.split(sep).at(-1).startsWith("카테고리검증-"));
  await rm(outputDir, { recursive: true, force: true });
}
console.log("five category assignments: legacy compatibility, deduplication, limit and storage roundtrip ok");
