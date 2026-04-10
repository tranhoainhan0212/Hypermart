function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeOrigin(origin) {
  if (!origin) return "";
  if (origin.startsWith("http://") || origin.startsWith("https://")) {
    try {
      return new URL(origin).origin;
    } catch {
      return origin;
    }
  }
  return origin;
}

function matchesWildcardPattern(value, pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`).test(value);
}

function getAllowedOrigins() {
  const envOrigins = splitCsv(process.env.CLIENT_ORIGIN);
  const frontendUrl = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.trim()] : [];
  const defaults = process.env.NODE_ENV === "production" ? [] : ["http://localhost:5173"];
  return unique([...envOrigins, ...frontendUrl, ...defaults].map(normalizeOrigin));
}

function getPrimaryClientOrigin() {
  return getAllowedOrigins()[0] || "http://localhost:5173";
}

function getBackendUrl() {
  const explicit = process.env.BACKEND_URL && process.env.BACKEND_URL.trim();
  if (explicit) return explicit;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT || 3000}`;
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  const exactOrigins = getAllowedOrigins();
  if (exactOrigins.includes(normalized)) return true;

  const wildcardPatterns = splitCsv(process.env.ALLOWED_ORIGIN_PATTERNS);
  if (wildcardPatterns.some((pattern) => matchesWildcardPattern(normalized, pattern))) {
    return true;
  }

  try {
    const hostname = new URL(normalized).hostname;
    for (const allowedOrigin of exactOrigins) {
      const allowedHostname = new URL(allowedOrigin).hostname;
      if (allowedHostname.endsWith(".vercel.app")) {
        const baseLabel = allowedHostname.replace(/\.vercel\.app$/, "");
        if (hostname === allowedHostname || hostname.startsWith(`${baseLabel}-`)) {
          return true;
        }
      }
    }
  } catch {
    return false;
  }

  return false;
}

module.exports = {
  getAllowedOrigins,
  getPrimaryClientOrigin,
  getBackendUrl,
  isAllowedOrigin,
};
