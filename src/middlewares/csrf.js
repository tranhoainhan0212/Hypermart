const crypto = require("crypto");
const { HttpError } = require("../utils/httpError");

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
  res.clearCookie("csrfToken", { path: "/" });
}

/**
 * Check Origin/Referer header to prevent cross-site requests
 */
function checkOrigin(req, _res, next) {
  // Allow GET/HEAD/OPTIONS (read-only) without origin check
  const method = String(req.method || "GET").toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return next();

  // Allow known webhook/IPN endpoints to bypass Origin check (server-to-server calls)
  const allowedWebhookPaths = (process.env.ALLOWED_WEBHOOK_PATHS || "/api/payments/momo/webhook,/api/payments/vnpay/ipn").split(",").map(s => s.trim());
  const reqPath = req.originalUrl || req.url || "";
  if (allowedWebhookPaths.some(p => p && reqPath.startsWith(p))) return next();

  const allowedOrigins = process.env.CLIENT_ORIGIN?.split(",") || [
    "http://localhost:5173",
    "http://localhost:3000",
  ];

  const origin = req.headers.origin || req.headers.referer;
  if (!origin) {
    return next(new HttpError(403, "Missing Origin header"));
  }

  // Extract origin from referer if needed
  let requesterOrigin = origin;
  if (origin.startsWith("http")) {
    try {
      requesterOrigin = new URL(origin).origin;
    } catch {}
  }

  // Check if origin is in whitelist
  const isAllowed = allowedOrigins.some((allowed) => {
    const normalizedAllowed = new URL(allowed.trim()).origin;
    return requesterOrigin === normalizedAllowed;
  });

  if (!isAllowed) {
    return next(
      new HttpError(
        403,
        `Origin ${requesterOrigin} not allowed`
      )
    );
  }

  next();
}

/**
 * CSRF protection for state-changing requests
 * Use after checkOrigin middleware
 */
function requireCsrf(req, _res, next) {
  // Only apply to state-changing requests
  const method = String(req.method || "GET").toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return next();

  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.headers["x-csrf-token"];

  if (!cookieToken) return next(new HttpError(403, "Missing CSRF token"));
  if (!headerToken || String(headerToken) !== String(cookieToken)) {
    return next(new HttpError(403, "Invalid CSRF token"));
  }

  next();
}

module.exports = { setCsrfCookie, clearCsrfCookie, requireCsrf, checkOrigin };

