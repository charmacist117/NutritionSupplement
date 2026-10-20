import { readFile, mkdir, appendFile, writeFile } from "node:fs/promises";
import { gzipSync, gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fetchHealthProductIndex, fetchHealthProductDetails } from "../src/healthProducts.js";
import { validateProductTypeCatalog } from "../src/productTypeCatalog.js";

export async function collectProductTypes(items, previous, saveBatch, fetchDetails = fetchHealthProductDetails) {
  const koreanDay = (value) => new Date(Date.parse(value) + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const today = koreanDay(new Date().toISOString());
  const byId = new Map(previous.filter((item) => typeof item.allTypes === "string" && !item.detailError
    && Number.isFinite(Date.parse(item.typesFetchedAt)) && koreanDay(item.typesFetchedAt) === today)
    .map(({ id, allTypes, typesFetchedAt }) => [id, { id, allTypes, typesFetchedAt }]));
  for (let pass = 0; pass < 3; pass++) {
    const pending = items.filter((item) => !byId.has(item.id));
    for (let offset = 0; offset < pending.length; offset += 100) {
      let batch;
      try { batch = await fetchDetails(pending.slice(offset, offset + 100), { concurrency: 8 }); }
      catch (error) { console.error(`상세 세션 실패, 다음 시도에 재수집: ${error.message}`); continue; }
      const verified = batch.filter((item) => !item.detailError && typeof item.allTypes === "string")
        .map((item) => ({ id: item.id, allTypes: item.allTypes, typesFetchedAt: item.fetchedAt }));
      for (const item of verified) byId.set(item.id, item);
      const completed = items.filter((item) => byId.has(item.id)).length;
      await saveBatch(verified, completed);
      console.log(`유형 확인 ${completed}/${items.length} (시도 ${pass + 1})`);
    }
  }
  const missing = items.filter((item) => !byId.has(item.id));
  if (missing.length) throw new Error(`${missing.length}개 제품 상세 확인 실패. 기존 완성본을 유지합니다. 예: ${missing.slice(0, 10).map((item) => item.id).join(", ")}`);
  return items.map((item) => ({ ...item, ...byId.get(item.id) }));
}

async function main() {
  const directory = "수집자료";
  await mkdir(directory, { recursive: true });
  const checkpoint = `${directory}/진행.jsonl`;
  let previous = [];
  try {
    for (const line of (await readFile(checkpoint, "utf8")).split("\n").filter(Boolean)) {
      try { previous.push(JSON.parse(line)); } catch { /* 중단된 마지막 줄은 재수집한다. */ }
    }
  } catch (error) { if (error.code !== "ENOENT") throw error; }
  try { previous.unshift(...validateProductTypeCatalog(JSON.parse(gunzipSync(await readFile(`${directory}/이전.json.gz`)))).items); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  await appendFile(checkpoint, "\n");
  console.log(`기존 유형 기록 ${previous.length}개, 원본 제품 목록 조회`);
  let index;
  for (let attempt = 0; attempt < 3; attempt++) {
    try { index = await fetchHealthProductIndex({ timeoutMs: 180000 }); break; }
    catch (error) { if (attempt === 2) throw error; console.error(error.message); }
  }
  if (!index.total) throw new Error("원본 목록이 비어 있어 게시하지 않습니다.");
  console.log(`원본 목록 ${index.total}개 확인`);
  let reportedAt = 0;
  const items = await collectProductTypes(index.items, previous, async (batch, completed) => {
    if (batch.length) await appendFile(checkpoint, batch.map((item) => JSON.stringify(item)).join("\n") + "\n");
    if (process.env.GITHUB_ACTIONS && Date.now() - reportedAt >= 60000) {
      reportedAt = Date.now();
      try {
        await promisify(execFile)("gh", ["api", `repos/${process.env.GITHUB_REPOSITORY}/statuses/${process.env.GITHUB_SHA}`,
          "-f", "state=pending", "-f", "context=전체 유형 수집", "-f", `description=유형 확인 ${completed}/${index.total}`]);
      } catch (error) { console.error(`수집 진행 표시 실패: ${error.message}`); }
    }
  });
  const catalog = validateProductTypeCatalog({ schemaVersion: 1, complete: true, total: items.length,
    builtAt: new Date().toISOString(), sourceUrl: index.sourceUrl, items });
  const output = `${directory}/catalog-${process.env.GITHUB_RUN_ID || Date.now()}-${process.env.GITHUB_RUN_ATTEMPT || 1}.json.gz`;
  await writeFile(output, gzipSync(JSON.stringify(catalog)));
  await writeFile(checkpoint, items.map(({ id, allTypes, typesFetchedAt }) => JSON.stringify({ id, allTypes, typesFetchedAt })).join("\n") + "\n");
  console.log(`완성본 저장: ${output} (${catalog.total}개)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error); process.exitCode = 1; });
