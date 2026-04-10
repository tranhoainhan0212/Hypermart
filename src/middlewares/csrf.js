const crypto = require("crypto");
const { HttpError } = require("../utils/httpError");
const { getAllowedOrigins, isAllowedOrigin } = require("../config/runtime");

function isCsrfDisabled() {
  return process.env.DISABLE_CSRF === "true";
}

function generateCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

function setCsrfCookie(res) {
  const token = generateCsrfToken();
  res.cookie("csrfToken", token, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return token;
}

function clearCsrfCookie(res) {
  res.clearCookie("csrfToken", {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

function checkOrigin(req, _res, next) {
  if (isCsrfDisabled()) return next();

  const method = String(req.method || "GET").toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return next();

  const allowedWebhookPaths = (process.env.ALLOWED_WEBHOOK_PATHS ||
    "/api/payments/momo/webhook,/api/payments/vnpay/ipn")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const reqPath = req.originalUrl || req.url || "";
  if (allowedWebhookPaths.some((p) => reqPath.startsWith(p))) return next();

  const origin = req.headers.origin || req.headers.referer;
  if (!origin) return next();

  if (!isAllowedOrigin(origin)) {
    return next(
      new HttpError(
        403,
        `Origin not allowed. Allowed origins: ${getAllowedOrigins().join(", ") || "none configured"}`
      )
    );
  }

  next();
}

function requireCsrf(req, _res, next) {
  if (isCsrfDisabled()) return next();

  const method = String(req.method || "GET").toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return next();

  const allowedWebhookPaths = (process.env.ALLOWED_WEBHOOK_PATHS ||
    "/api/payments/momo/webhook,/api/payments/vnpay/ipn")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const reqPath = req.originalUrl || req.url || "";
  if (allowedWebhookPaths.some((p) => reqPath.startsWith(p))) return next();

  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.headers["x-csrf-token"];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new HttpError(403, "Invalid or missing CSRF token"));
  }

  next();
}

module.exports = { setCsrfCookie, clearCsrfCookie, requireCsrf, checkOrigin };
