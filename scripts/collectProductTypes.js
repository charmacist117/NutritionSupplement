import { mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { setTimeout } from "node:timers/promises";
import { fetchFoodsafetyApiPage, normalizeFoodsafetyProduct, FOODSAFETY_API_SOURCE_URL } from "../src/foodsafetyApi.js";
import { validateProductTypeCatalog } from "../src/productTypeCatalog.js";

export async function collectProductTypeCatalog(fetchPage = fetchFoodsafetyApiPage, pause = () => setTimeout(1000)) {
  const first = await fetchPage(1, 1000);
  if (!first.total) throw new Error("공식 API 목록이 비어 있어 기존 완성본을 유지합니다.");
  const rows = [];
  for (let start = 1; start <= first.total; start += 1000) {
    const end = Math.min(start + 999, first.total);
    const page = start === 1 ? first : await fetchPage(start, end);
    if (page.total !== first.total || page.rows.length !== end - start + 1) throw new Error("공식 API 수집 도중 건수가 변경되거나 일부가 누락되어 게시하지 않습니다.");
    rows.push(...page.rows);
    console.log(`공식 API 전체 유형 ${rows.length}/${first.total}개 확인`);
    if (end < first.total) await pause();
  }
  const builtAt = new Date().toISOString();
  const items = rows.map((row) => normalizeFoodsafetyProduct(row, builtAt)).sort((a, b) => a.name.localeCompare(b.name, "ko"));
  return validateProductTypeCatalog({ schemaVersion: 1, complete: true, total: first.total, builtAt, sourceUrl: FOODSAFETY_API_SOURCE_URL, items });
}

async function main() {
  const catalog = await collectProductTypeCatalog();
  await mkdir("수집자료", { recursive: true });
  const path = `수집자료/catalog-${process.env.GITHUB_RUN_ID || Date.now()}-${process.env.GITHUB_RUN_ATTEMPT || 1}.json.gz`;
  await writeFile(path, gzipSync(JSON.stringify(catalog)));
  console.log(`검증된 완성본: ${path} (${catalog.total}개)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
