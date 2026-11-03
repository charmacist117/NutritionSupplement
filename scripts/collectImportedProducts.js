import { mkdir, writeFile } from "node:fs/promises";
import { fetchImportedHealthProductPage } from "../src/importedHealthProducts.js";

try {
  const sources = {};
  for (const source of ["item", "text"]) {
    sources[source] = await fetchImportedHealthProductPage(source, 1, 2);
    console.log(`${source}: 건강기능식품 전체 ${sources[source].total}건, 응답 ${sources[source].rows.length}건 확인`);
  }
  await mkdir("수집자료", { recursive: true });
  await writeFile("수집자료/수입API-샘플.json", JSON.stringify(sources, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
