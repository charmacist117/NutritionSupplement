import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "nutrition_admin";
const SESSION_SECONDS = 8 * 60 * 60;

function sameSecret(a, b) {
  const digest = (value) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(a), digest(b));
}

function password() {
  return String(process.env.ADMIN_PASSWORD || "");
}

function signature(value) {
  return createHmac("sha256", password()).update(value).digest("base64url");
}

export function adminSession(request) {
  const configured = password().length >= 16;
  const cookie = String(request.headers?.cookie || "").split(";")
    .map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`));
  const token = cookie?.slice(COOKIE_NAME.length + 1) || "";
  const [expires, nonce, signed, extra] = token.split(".");
  const valid = configured && !extra && /^\d{10}$/.test(expires || "") && /^[A-Za-z0-9_-]{22}$/.test(nonce || "")
    && Number(expires) > Math.floor(Date.now() / 1000)
    && sameSecret(signed || "", signature(`${expires}.${nonce}`));
  return { configured, authenticated: Boolean(valid) };
}

export function requireAdmin(request) {
  const session = adminSession(request);
  if (!session.configured) {
    const error = new Error("관리자 비밀번호가 설정되지 않았습니다. ADMIN_PASSWORD를 16자 이상으로 등록해주세요.");
    error.status = 503; throw error;
  }
  if (!session.authenticated) {
    const error = new Error("관리자 로그인이 필요합니다.");
    error.status = 401; throw error;
  }
  checkOrigin(request);
}

export function requireCron(request) {
  const secret = String(process.env.CRON_SECRET || "");
  if (!secret || !sameSecret(String(request.headers?.authorization || ""), `Bearer ${secret}`)) {
    const error = new Error("예약 수집 인증에 실패했습니다.");
    error.status = 401; throw error;
  }
}

function checkOrigin(request) {
  const origin = request.headers?.origin;
  const host = request.headers?.host;
  let originHost;
  try { originHost = origin ? new URL(origin).host : ""; } catch { originHost = ""; }
  if (origin && (!host || originHost !== host)) {
    const error = new Error("허용되지 않은 요청 출처입니다.");
    error.status = 403; throw error;
  }
}

function sessionCookie(request, value, maxAge) {
  const secure = process.env.VERCEL || request.headers?.["x-forwarded-proto"] === "https" || request.socket?.encrypted;
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

export function handleAdminSession(request, response) {
  response.setHeader("Cache-Control", "no-store");
  try {
    if (request.method === "GET") return response.status(200).json(adminSession(request));
    if (!["POST", "DELETE"].includes(request.method)) return response.status(405).json({ error: "Method not allowed" });
    checkOrigin(request);
    if (request.method === "DELETE") {
      response.setHeader("Set-Cookie", sessionCookie(request, "", 0));
      return response.status(200).json({ configured: password().length >= 16, authenticated: false });
    }
    if (password().length < 16) return response.status(503).json({ error: "ADMIN_PASSWORD를 16자 이상으로 등록해주세요." });
    const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
    if (typeof body?.password !== "string" || body.password.length > 1024 || !sameSecret(body.password, password())) {
      return response.status(401).json({ error: "비밀번호가 일치하지 않습니다." });
    }
    const value = `${Math.floor(Date.now() / 1000) + SESSION_SECONDS}.${randomBytes(16).toString("base64url")}`;
    response.setHeader("Set-Cookie", sessionCookie(request, `${value}.${signature(value)}`, SESSION_SECONDS));
    return response.status(200).json({ configured: true, authenticated: true });
  } catch (error) {
    return response.status(error.status || 400).json({ error: error.status ? error.message : "요청 형식을 확인해주세요." });
  }
}
