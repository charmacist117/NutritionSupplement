import assert from "node:assert/strict";
import { adminSession, handleAdminSession, requireAdmin, requireCron } from "../src/adminAuth.js";
import monthlyReport from "../api/monthly-report.js";
import mappings from "../api/keyword-category-mappings.js";
import settings from "../api/naver-api-settings.js";
import collect from "../api/collect-monthly.js";
import shoppingKeywords from "../api/shopping-keywords.js";
import ingredients from "../api/individual-ingredients.js";
import executivePdf from "../api/executive-report.js";
import comparisonPdf from "../api/comparison-report.js";

const names = ["ADMIN_PASSWORD", "CRON_SECRET", "VERCEL"];
const previous = names.map((name) => [name, process.env[name]]);
const response = () => ({
  headers: {}, setHeader(name, value) { this.headers[name] = value; },
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});
try {
  delete process.env.ADMIN_PASSWORD;
  assert.equal(adminSession({ headers: {} }).configurationIssue, "password_missing");
  assert.throws(() => requireAdmin({ headers: {} }), { status: 503 });
  process.env.ADMIN_PASSWORD = "short";
  assert.equal(adminSession({ headers: {} }).configurationIssue, "password_too_short");
  process.env.ADMIN_PASSWORD = "test-password-only-123456";
  process.env.CRON_SECRET = "test-cron-only";
  process.env.VERCEL = "1";
  const denied = response();
  handleAdminSession({ method: "POST", body: { password: "wrong" }, headers: {} }, denied);
  assert.equal(denied.statusCode, 401);
  const login = response();
  handleAdminSession({ method: "POST", body: { password: process.env.ADMIN_PASSWORD }, headers: { host: "example.test", origin: "https://example.test" } }, login);
  assert.equal(login.statusCode, 200);
  assert.match(login.headers["Set-Cookie"], /HttpOnly; SameSite=Strict; Max-Age=28800; Secure/);
  const cookie = login.headers["Set-Cookie"].split(";")[0];
  const authenticated = { headers: { cookie, host: "example.test", origin: "https://example.test" } };
  assert.equal(adminSession(authenticated).authenticated, true);
  requireAdmin(authenticated);
  const now = Date.now;
  try {
    Date.now = () => now() + 9 * 60 * 60 * 1000;
    assert.equal(adminSession(authenticated).authenticated, false);
  } finally { Date.now = now; }
  assert.throws(() => requireAdmin({ headers: { ...authenticated.headers, origin: "https://other.test" } }), { status: 403 });
  assert.throws(() => requireAdmin({ headers: { ...authenticated.headers, origin: "invalid" } }), { status: 403 });
  assert.equal(adminSession({ headers: { cookie: cookie + "tampered" } }).authenticated, false);
  process.env.ADMIN_PASSWORD += "-rotated";
  assert.equal(adminSession(authenticated).authenticated, false);
  requireCron({ headers: { authorization: "Bearer test-cron-only" } });
  assert.throws(() => requireCron({ headers: { "user-agent": "vercel-cron/1.0" } }), { status: 401 });
  for (const [handler, method] of [
    [monthlyReport, "POST"], [monthlyReport, "DELETE"], [mappings, "POST"], [settings, "PUT"],
    [collect, "POST"], [shoppingKeywords, "POST"], [ingredients, "POST"], [executivePdf, "POST"], [comparisonPdf, "POST"]
  ]) {
    const result = response();
    await handler({ method, headers: {}, query: {}, body: {} }, result);
    assert.equal(result.statusCode, 401, `${handler.name} ${method}`);
  }
  const cron = response();
  await collect({ method: "GET", headers: { "user-agent": "vercel-cron/1.0" } }, cron);
  assert.equal(cron.statusCode, 401);
  const logout = response();
  handleAdminSession({ method: "DELETE", headers: {} }, logout);
  assert.match(logout.headers["Set-Cookie"], /Max-Age=0/);
} finally {
  for (const [name, value] of previous) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}
console.log("admin cookies, secret rotation, origin checks, protected routes and cron bypass checks ok");
