const express = require("express");
const { z } = require("zod");

const { validate } = require("../middlewares/validate");
const { requireAuth } = require("../middlewares/auth");
const { requireCsrf } = require("../middlewares/csrf");
const ctrl = require("../controllers/auth.controller");

const router = express.Router();

router.post(
  "/register",
  validate(
    z.object({
      body: z.object({
        email: z.string().email(),
        password: z.string().min(6).max(72),
        name: z.string().max(80).optional(),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  ctrl.register
);

router.post(
  "/login",
  validate(
    z.object({
      body: z.object({
        email: z.string().email(),
        password: z.string().min(6).max(72),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  ctrl.login
);

// Refresh endpoint: allow refresh without CSRF token because refresh uses httpOnly refresh cookie
// and additional verification on the server side. This makes local OAuth redirects more reliable.
router.post("/refresh", ctrl.refresh);
router.post("/logout", requireCsrf, ctrl.logout);

router.get("/me", requireAuth, ctrl.me);
router.put(
  "/me",
  requireCsrf,
  requireAuth,
  validate(
    z.object({
      body: z.object({
        name: z.string().max(80).optional(),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  ctrl.updateMe
);

router.post(
  "/forgot-password",
  validate(
    z.object({
      body: z.object({ email: z.string().email() }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  ctrl.forgotPassword
);

router.post(
  "/reset-password",
  validate(
    z.object({
      body: z.object({
        email: z.string().email(),
        token: z.string().min(10),
        newPassword: z.string().min(6).max(72),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  ctrl.resetPassword
);

module.exports = router;

