function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function getAllowedOrigins() {
  const envOrigins = splitCsv(process.env.CLIENT_ORIGIN);
  const frontendUrl = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.trim()] : [];
  const defaults = process.env.NODE_ENV === "production" ? [] : ["http://localhost:5173"];
  return unique([...envOrigins, ...frontendUrl, ...defaults]);
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

  let normalized = origin;
  if (origin.startsWith("http://") || origin.startsWith("https://")) {
    try {
      normalized = new URL(origin).origin;
    } catch {
      normalized = origin;
    }
  }

  return getAllowedOrigins().includes(normalized);
}

module.exports = {
  getAllowedOrigins,
  getPrimaryClientOrigin,
  getBackendUrl,
  isAllowedOrigin,
};
