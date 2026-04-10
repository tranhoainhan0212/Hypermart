const express = require("express");
const passport = require("passport");
const ctrl = require("../controllers/oauth.controller");
const { getPrimaryClientOrigin } = require("../config/runtime");

const router = express.Router();

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/api/auth/google/failure" }),
  ctrl.googleCallbackRedirect
);

router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/api/auth/facebook/failure" }),
  ctrl.facebookCallbackRedirect
);

router.get("/google/failure", (_req, res) => {
  res.redirect(`${getPrimaryClientOrigin()}/login?error=google_auth_cancelled`);
});

router.get("/facebook/failure", (_req, res) => {
  res.redirect(`${getPrimaryClientOrigin()}/login?error=facebook_auth_cancelled`);
});

module.exports = router;
