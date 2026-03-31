const express = require("express");
const { z } = require("zod");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { requireCsrf } = require("../middlewares/csrf");
const { validate } = require("../middlewares/validate");
const ctrl = require("../controllers/admin.controller");

const router = express.Router();

router.get("/dashboard", requireAuth, requireRole("admin"), ctrl.dashboardStats);

// User management
router.get(
  "/users",
  requireAuth,
  requireRole("admin"),
  validate(
    z.object({
      body: z.any().optional(),
      params: z.object({}).optional(),
      query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        search: z.string().optional(),
        role: z.enum(["user", "admin"]).optional(),
      }),
    })
  ),
  ctrl.listUsers
);

router.put(
  "/users/:userId/ban",
  requireCsrf,
  requireAuth,
  requireRole("admin"),
  validate(
    z.object({
      body: z.object({
        reason: z.string().max(500).optional(),
      }),
      params: z.object({ userId: z.string().min(1) }),
      query: z.object({}).optional(),
    })
  ),
  ctrl.banUser
);

router.put(
  "/users/:userId/unban",
  requireCsrf,
  requireAuth,
  requireRole("admin"),
  validate(
    z.object({
      body: z.any().optional(),
      params: z.object({ userId: z.string().min(1) }),
      query: z.object({}).optional(),
    })
  ),
  ctrl.unbanUser
);

router.put(
  "/users/:userId/role",
  requireCsrf,
  requireAuth,
  requireRole("admin"),
  validate(
    z.object({
      body: z.object({
        role: z.enum(["user", "admin"]),
      }),
      params: z.object({ userId: z.string().min(1) }),
      query: z.object({}).optional(),
    })
  ),
  ctrl.changeUserRole
);

router.delete(
  "/users/:userId",
  requireCsrf,
  requireAuth,
  requireRole("admin"),
  validate(
    z.object({
      body: z.any().optional(),
      params: z.object({ userId: z.string().min(1) }),
      query: z.object({}).optional(),
    })
  ),
  ctrl.deleteUser
);

module.exports = router;

