const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { HttpError } = require("../utils/httpError");
const { verifyAccessToken } = require("../utils/jwt");

async function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, "Missing access token"));

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select("email name role isBanned");
    if (!user) return next(new HttpError(401, "User not found"));
    if (user.isBanned) return next(new HttpError(403, "Account has been banned"));
    req.user = user;
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired access token"));
  }
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, "Unauthorized"));
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, "Forbidden"));
    }
    next();
  };
}

async function hashToken(token) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(token, salt);
}

async function compareToken(token, tokenHash) {
  if (!tokenHash) return false;
  return bcrypt.compare(token, tokenHash);
}

module.exports = { requireAuth, requireRole, hashToken, compareToken };
