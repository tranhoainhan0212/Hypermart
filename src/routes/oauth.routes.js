const express = require("express");
const passport = require("passport");
const ctrl = require("../controllers/oauth.controller");

const router = express.Router();

// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/api/auth/google/failure" }),
  ctrl.googleCallbackRedirect
);

// Facebook OAuth
router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/api/auth/facebook/failure" }),
  ctrl.facebookCallbackRedirect
);

// Failure routes
router.get("/google/failure", (req, res) => {
  const redirectUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=google_auth_cancelled`;
  res.redirect(redirectUrl);
});

router.get("/facebook/failure", (req, res) => {
  const redirectUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=facebook_auth_cancelled`;
  res.redirect(redirectUrl);
});

module.exports = router;
