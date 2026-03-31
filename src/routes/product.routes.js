const express = require("express");
const { z } = require("zod");

const { validate } = require("../middlewares/validate");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { requireCsrf } = require("../middlewares/csrf");
const ctrl = require("../controllers/product.controller");

const router = express.Router();

router.get(
  "/",
  validate(
    z.object({
      body: z.any().optional(),
      params: z.object({}).optional(),
      query: z.object({
        q: z.string().trim().min(1).max(120).optional(),
        category: z.string().min(1).optional(),
        minPrice: z.string().optional(),
        maxPrice: z.string().optional(),
        minRating: z.string().optional(),
        page: z.string().optional(),
        limit: z.string().optional(),
        sort: z.enum(["newest", "price_asc", "price_desc", "rating_desc"]).optional(),
      }),
    })
  ),
  ctrl.listProducts
);

router.get(
  "/:idOrSlug",
  validate(
    z.object({
      body: z.any().optional(),
      params: z.object({ idOrSlug: z.string().min(1) }),
      query: z.object({}).optional(),
    })
  ),
  ctrl.getProduct
);

router.post(
  "/",
  requireCsrf,
  requireAuth,
  requireRole("admin"),
  validate(
    z.object({
      body: z.object({
        name: z.string().min(2).max(120),
        description: z.string().max(4000).optional(),
        price: z.number().min(0),
        stock: z.number().int().min(0),
        categoryId: z.string().min(1),
        images: z
          .array(z.object({ url: z.string().min(1), alt: z.string().max(120).optional() }))
          .optional(),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  ctrl.createProduct
);

router.put(
  "/:id",
  requireCsrf,
  requireAuth,
  requireRole("admin"),
  validate(
    z.object({
      body: z.object({
        name: z.string().min(2).max(120).optional(),
        description: z.string().max(4000).optional(),
        price: z.number().min(0).optional(),
        stock: z.number().int().min(0).optional(),
        categoryId: z.string().min(1).optional(),
        images: z
          .array(z.object({ url: z.string().min(1), alt: z.string().max(120).optional() }))
          .optional(),
      }),
      params: z.object({ id: z.string().min(1) }),
      query: z.object({}).optional(),
    })
  ),
  ctrl.updateProduct
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
  ctrl.deleteProduct
);

module.exports = router;

