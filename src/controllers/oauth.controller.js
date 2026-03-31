const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { hashToken } = require("../middlewares/auth");
const { setCsrfCookie } = require("../middlewares/csrf");

// ✅ Lấy frontend URL chuẩn
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ================= GOOGLE =================

// Google callback handler (passport)
function googleCallback(accessToken, refreshToken, profile, done) {
  User.findOne({ email: profile.emails?.[0]?.value })
    .then(user => {
      const email = profile.emails?.[0]?.value;
      const name = profile.displayName;
      const googleId = profile.id;

      if (!email) return done(null, false, { message: "Email not provided by Google" });

      if (user) {
        if (!user.googleId) {
          user.googleId = googleId;
          return user.save().then(() => done(null, user));
        }
        return done(null, user);
      }

      const newUser = new User({
        email,
        name,
        googleId,
        verified: true,
        password: require("crypto").randomBytes(16).toString("hex"),
      });

      return newUser.save().then(() => done(null, newUser));
    })
    .catch(err => done(err));
}

// ================= FACEBOOK =================

function facebookCallback(accessToken, refreshToken, profile, done) {
  User.findOne({ email: profile.emails?.[0]?.value })
    .then(user => {
      const email = profile.emails?.[0]?.value;
      const name = profile.displayName;
      const facebookId = profile.id;

      if (!email) return done(null, false, { message: "Email not provided by Facebook" });

      if (user) {
        if (!user.facebookId) {
          user.facebookId = facebookId;
          return user.save().then(() => done(null, user));
        }
        return done(null, user);
      }

      const newUser = new User({
        email,
        name,
        facebookId,
        verified: true,
        password: require("crypto").randomBytes(16).toString("hex"),
      });

      return newUser.save().then(() => done(null, newUser));
    })
    .catch(err => done(err));
}

// ================= TOKEN =================

async function generateTokens(user) {
  const accessToken = jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
}

// ================= GOOGLE REDIRECT =================

function googleRedirect(req, res) {
  res.redirect("/api/auth/google/callback");
}

// ================= GOOGLE CALLBACK =================

async function googleCallbackRedirect(req, res) {
  try {
    if (!req.user) {
      return res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
    }

    const { accessToken, refreshToken } = await generateTokens(req.user);

    await User.findByIdAndUpdate(req.user._id, {
      refreshTokenHash: await hashToken(refreshToken),
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/refresh",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const csrfToken = setCsrfCookie(res);

    // ✅ FIX CHUẨN: dùng FRONTEND_URL duy nhất
    const redirectUrl = `${FRONTEND_URL}/auth-callback?token=${accessToken}&csrf=${csrfToken}`;

    console.log("Redirecting to:", redirectUrl); // debug

    res.redirect(redirectUrl);
  } catch (err) {
    console.error("Google callback error:", err);
    res.redirect(`${FRONTEND_URL}/login?error=callback_error`);
  }
}

// ================= FACEBOOK CALLBACK =================

async function facebookCallbackRedirect(req, res) {
  try {
    if (!req.user) {
      return res.redirect(`${FRONTEND_URL}/login?error=facebook_auth_failed`);
    }

    const { accessToken, refreshToken } = await generateTokens(req.user);

    await User.findByIdAndUpdate(req.user._id, {
      refreshTokenHash: await hashToken(refreshToken),
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/refresh",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const csrfToken = setCsrfCookie(res);

    const redirectUrl = `${FRONTEND_URL}/auth-callback?token=${accessToken}&csrf=${csrfToken}`;

    console.log("Redirecting to:", redirectUrl);

    res.redirect(redirectUrl);
  } catch (err) {
    console.error("Facebook callback error:", err);
    res.redirect(`${FRONTEND_URL}/login?error=callback_error`);
  }
}

module.exports = {
  googleCallback,
  facebookCallback,
  googleRedirect,
  googleCallbackRedirect,
  facebookCallbackRedirect,
};