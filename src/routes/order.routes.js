const express = require("express");
const { z } = require("zod");

const { validate } = require("../middlewares/validate");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { requireCsrf } = require("../middlewares/csrf");
const ctrl = require("../controllers/order.controller");

const router = express.Router();

router.post(
  "/",
  requireCsrf,
  requireAuth,
  validate(
    z.object({
      body: z.object({
        shippingAddress: z.object({
          fullName: z.string().min(2).max(120),
          phone: z.string().min(6).max(30),
          addressLine1: z.string().min(3).max(200),
          addressLine2: z.string().max(200).optional(),
          city: z.string().min(2).max(80),
          province: z.string().min(2).max(80),
          postalCode: z.string().max(20).optional(),
          country: z.string().max(2).optional(),
        }),
        paymentMethod: z.enum(["COD", "PAYPAL", "MOMO", "VNPAY"]).default("COD"),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  ctrl.createOrderFromCart
);

router.get(
  "/me",
  requireAuth,
  validate(
    z.object({
      body: z.any().optional(),
      params: z.object({}).optional(),
      query: z.object({ page: z.string().optional(), limit: z.string().optional() }),
    })
  ),
  ctrl.listMyOrders
);

router.get(
  "/me/:id",
  requireAuth,
  validate(
    z.object({
      body: z.any().optional(),
      params: z.object({ id: z.string().min(1) }),
      query: z.object({}).optional(),
    })
  ),
  ctrl.getMyOrder
);

// Admin
router.get(
  "/",
  requireAuth,
  requireRole("admin"),
  validate(
    z.object({
      body: z.any().optional(),
      params: z.object({}).optional(),
      query: z.object({
        status: z.enum(["pending", "confirmed", "shipping", "completed", "cancelled"]).optional(),
        page: z.string().optional(),
        limit: z.string().optional(),
      }),
    })
  ),
  ctrl.adminListOrders
);

router.put(
  "/:id/status",
  requireAuth,
  requireRole("admin"),
  validate(
    z.object({
      body: z.object({
        orderStatus: z.enum(["pending", "confirmed", "shipping", "completed", "cancelled"]),
      }),
      params: z.object({ id: z.string().min(1) }),
      query: z.object({}).optional(),
    })
  ),
  ctrl.adminUpdateOrderStatus
);

module.exports = router;

