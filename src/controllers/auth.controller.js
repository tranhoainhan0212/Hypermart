const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const { HttpError } = require("../utils/httpError");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");
const { hashToken, compareToken } = require("../middlewares/auth");
const { sendMail } = require("../utils/email");
const { resetPasswordEmailTemplate } = require("../utils/emails/resetPasswordEmail");
const { setCsrfCookie, clearCsrfCookie } = require("../middlewares/csrf");

function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
}

async function register(req, res) {
  const { email, password, name } = req.validated.body;

  const exists = await User.findOne({ email });
  if (exists) throw new HttpError(409, "Email already registered");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    email,
    passwordHash,
    name: name || "",
    isEmailVerified: true, // simplified: mark verified
  });

  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
  const refreshToken = signRefreshToken({ sub: user._id.toString(), role: user.role });
  user.refreshTokenHash = await hashToken(refreshToken);
  await user.save();

  setRefreshCookie(res, refreshToken);
  setCsrfCookie(res);
  res.status(201).json({
    user: { id: user._id, email: user.email, name: user.name, role: user.role },
    accessToken,
  });
}

async function login(req, res) {
  const { email, password } = req.validated.body;

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) throw new HttpError(401, "Invalid credentials");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new HttpError(401, "Invalid credentials");

  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
  const refreshToken = signRefreshToken({ sub: user._id.toString(), role: user.role });
  user.refreshTokenHash = await hashToken(refreshToken);
  await user.save();

  setRefreshCookie(res, refreshToken);
  setCsrfCookie(res);
  res.json({
    user: { id: user._id, email: user.email, name: user.name, role: user.role },
    accessToken,
  });
}

async function refresh(req, res) {
  const token = req.cookies?.refreshToken;
  if (!token) throw new HttpError(401, "Missing refresh token");

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new HttpError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(payload.sub).select("+refreshTokenHash email name role");
  if (!user) throw new HttpError(401, "User not found");

  const ok = await compareToken(token, user.refreshTokenHash);
  if (!ok) throw new HttpError(401, "Invalid refresh token");

  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
  
  // Rotate CSRF token on refresh
  const newCsrfToken = setCsrfCookie(res);
  
  res.json({ accessToken, csrfToken: newCsrfToken });
}

async function logout(req, res) {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await User.findByIdAndUpdate(payload.sub, { refreshTokenHash: null });
    } catch {
      // ignore
    }
  }
  clearRefreshCookie(res);
  clearCsrfCookie(res);
  res.json({ ok: true });
}

async function me(req, res) {
  res.json({ user: { id: req.user._id, email: req.user.email, name: req.user.name, role: req.user.role } });
}

async function updateMe(req, res) {
  const { name } = req.validated.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name: name || "" },
    { new: true }
  ).select("email name role");
  res.json({ user: { id: user._id, email: user.email, name: user.name, role: user.role } });
}

async function forgotPassword(req, res) {
  const { email } = req.validated.body;
  const user = await User.findOne({ email }).select("+resetPasswordTokenHash +resetPasswordExpiresAt");
  // Always return ok to prevent enumeration
  if (!user) return res.json({ ok: true });

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  user.resetPasswordTokenHash = tokenHash;
  user.resetPasswordExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();

  const resetUrl = `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/reset-password?token=${rawToken}&email=${encodeURIComponent(
    email
  )}`;

  await sendMail({
    to: email,
    subject: "Đặt lại mật khẩu",
    html: resetPasswordEmailTemplate({
      resetUrl,
      brandName: "E-Commerce",
    }),
  });

  res.json({ ok: true });
}

async function resetPassword(req, res) {
  const { email, token, newPassword } = req.validated.body;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({ email }).select("+resetPasswordTokenHash +resetPasswordExpiresAt");
  if (!user) throw new HttpError(400, "Invalid reset token");

  if (
    !user.resetPasswordTokenHash ||
    user.resetPasswordTokenHash !== tokenHash ||
    !user.resetPasswordExpiresAt ||
    user.resetPasswordExpiresAt.getTime() < Date.now()
  ) {
    throw new HttpError(400, "Invalid or expired reset token");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpiresAt = null;
  user.refreshTokenHash = null;
  await user.save();

  clearRefreshCookie(res);
  clearCsrfCookie(res);
  res.json({ ok: true });
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  updateMe,
  forgotPassword,
  resetPassword,
};

