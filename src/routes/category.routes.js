const express = require("express");
const { z } = require("zod");

const { validate } = require("../middlewares/validate");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { requireCsrf } = require("../middlewares/csrf");
const ctrl = require("../controllers/category.controller");

const router = express.Router();

router.get(
  "/",
  validate(
    z.object({
      body: z.any().optional(),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  ctrl.listCategories
);

router.post(
  "/",
  requireCsrf,
  requireAuth,
  requireRole("admin"),
  validate(
    z.object({
      body: z.object({ name: z.string().min(2).max(60) }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  ctrl.createCategory
);

router.put(
  "/:id",
  requireCsrf,
  requireAuth,
  requireRole("admin"),
  validate(
    z.object({
      body: z.object({ name: z.string().min(2).max(60) }),
      params: z.object({ id: z.string().min(1) }),
      query: z.object({}).optional(),
    })
  ),
  ctrl.updateCategory
);

router.delete(
  "/:id",
  requireCsrf,
  requireAuth,
  requireRole("admin"),
  validate(
    z.object({
      body: z.any().optional(),
      params: z.object({ id: z.string().min(1) }),
      query: z.object({}).optional(),
    })
  ),
  ctrl.deleteCategory
);

module.exports = router;

