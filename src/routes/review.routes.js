const express = require("express");
const { z } = require("zod");

const { validate } = require("../middlewares/validate");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { requireCsrf } = require("../middlewares/csrf");
const ctrl = require("../controllers/review.controller");

const router = express.Router();

router.get(
  "/",
  validate(
    z.object({
      body: z.any().optional(),
      params: z.object({}).optional(),
      query: z.object({
        productId: z.string().min(1).optional(),
        page: z.string().optional(),
        limit: z.string().optional(),
      }),
    })
  ),
  ctrl.listReviews
);

router.post(
  "/me",
  requireCsrf,
  requireAuth,
  validate(
    z.object({
      body: z.object({
        productId: z.string().min(1),
        rating: z.number().min(1).max(5),
        comment: z.string().max(2000).optional(),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  ctrl.createOrUpdateMyReview
);

router.delete(
  "/me/:id",
  requireCsrf,
  requireAuth,
  validate(
    z.object({
      body: z.any().optional(),
      params: z.object({ id: z.string().min(1) }),
      query: z.object({}).optional(),
    })
  ),
  ctrl.deleteMyReview
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
  ctrl.adminDeleteReview
);

module.exports = router;

