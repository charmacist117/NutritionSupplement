import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { getKeywordCategoryMappings, saveKeywordCategoryMappings } from "../src/storage.js";

const require = createRequire(import.meta.url);
const sdkRequire = createRequire(require.resolve("@vercel/blob"));
const { MockAgent, getGlobalDispatcher, setGlobalDispatcher } = sdkRequire("undici");
const dispatcher = getGlobalDispatcher();
const agent = new MockAgent();
agent.disableNetConnect();
const envNames = ["BLOB_READ_WRITE_TOKEN", "BLOB_STORE_ID", "VERCEL_OIDC_TOKEN", "VERCEL_BLOB_API_URL", "NEXT_PUBLIC_VERCEL_BLOB_API_URL"];
const previous = envNames.map((name) => [name, process.env[name]]);
for (const name of envNames) delete process.env[name];
process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_auditstore_mock-secret";
setGlobalDispatcher(agent);
const readPath = "/settings/keyword-category-mappings.json?cache=0";
const writePath = "/api/blob/?pathname=settings%2Fkeyword-category-mappings.json";
const origin = agent.get("https://auditstore.private.blob.vercel-storage.com");
const api = agent.get("https://vercel.com");
const payload = { categories: ["A"], mappings: [], categoryAliases: {}, updatedAt: null };
const read = (etag) => origin.intercept({ path: readPath, method: "GET" })
  .reply(200, JSON.stringify(payload), { headers: { etag, "content-type": "application/json" } });
try {
  read('"revision-1"').times(2);
  api.intercept({
    path: writePath, method: "PUT",
    headers: { "x-if-match": '"revision-1"', "x-allow-overwrite": "1", "x-add-random-suffix": "0" }
  }).reply(200, { etag: '"revision-2"' });
  const original = await getKeywordCategoryMappings();
  const saved = await saveKeywordCategoryMappings({ ...original, categories: ["B"] });
  assert.equal(saved.revision, '"revision-2"');
  read('"revision-2"');
  await assert.rejects(saveKeywordCategoryMappings(original), { status: 409 });

  // The write must still fail if another process wins after our fresh read.
  read('"revision-2"');
  api.intercept({ path: writePath, method: "PUT", headers: { "x-if-match": '"revision-2"' } })
    .reply(412, { error: { code: "precondition_failed" } });
  await assert.rejects(saveKeywordCategoryMappings(saved), { status: 409 });

  origin.intercept({ path: readPath, method: "GET" }).reply(404, "");
  api.intercept({
    path: writePath, method: "PUT", headers: { "x-allow-overwrite": "0", "x-add-random-suffix": "0" }
  }).reply(200, { etag: '"first-revision"' });
  assert.equal((await saveKeywordCategoryMappings({ ...payload, revision: null })).revision, '"first-revision"');
  origin.intercept({ path: readPath, method: "GET" }).reply(404, "");
  api.intercept({ path: writePath, method: "PUT" })
    .reply(400, { error: { code: "bad_request", message: "Blob already exists" } });
  read('"other-first-write"');
  await assert.rejects(saveKeywordCategoryMappings({ ...payload, revision: null }), { status: 409 });
  read("");
  await assert.rejects(getKeywordCategoryMappings(), /버전/);
  agent.assertNoPendingInterceptors();
} finally {
  setGlobalDispatcher(dispatcher);
  await agent.close();
  for (const [name, value] of previous) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}
console.log("actual Blob SDK: origin reads, stale revisions, conditional-write races and first save checks ok");
