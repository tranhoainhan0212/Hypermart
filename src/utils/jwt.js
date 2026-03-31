const jwt = require("jsonwebtoken");

function signAccessToken(payload) {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
}

function verifyAccessToken(token) {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  return jwt.verify(token, secret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};

