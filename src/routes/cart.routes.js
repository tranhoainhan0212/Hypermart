const express = require("express");
const { z } = require("zod");

const { validate } = require("../middlewares/validate");
const { requireAuth } = require("../middlewares/auth");
const { requireCsrf } = require("../middlewares/csrf");
const ctrl = require("../controllers/cart.controller");

const router = express.Router();

router.get(
  "/me",
  requireAuth,
  validate(
    z.object({
      body: z.any().optional(),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  ctrl.getMyCart
);

router.put(
  "/me",
  requireCsrf,
  requireAuth,
  validate(
    z.object({
      body: z.object({
        items: z.array(
          z.object({
            productId: z.string().min(1),
            quantity: z.number().int().min(1).max(999),
          })
        ),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  ctrl.setMyCart
);

router.delete(
  "/me",
  requireCsrf,
  requireAuth,
  validate(
    z.object({
      body: z.any().optional(),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  ctrl.clearMyCart
);

module.exports = router;

