const express = require("express");
const { z } = require("zod");

const { validate } = require("../middlewares/validate");
const { requireAuth } = require("../middlewares/auth");
const { requireCsrf } = require("../middlewares/csrf");
const ctrl = require("../controllers/payment.controller");

const router = express.Router();

/**
 * Initiate Momo payment for an order
 * POST /api/payments/momo/initiate
 */
router.post(
  "/momo/initiate",
  requireCsrf,
  requireAuth,
  validate(
    z.object({
      body: z.object({
        orderId: z.string().min(1),
        returnUrl: z.string().url().optional(),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  ctrl.initiateMomoPayment
);

/**
 * Momo webhook callback (IPN - Instant Payment Notification)
 * POST /api/payments/momo/webhook
 * No CSRF or auth required - called by Momo servers
 */
router.post("/momo/webhook", ctrl.momoWebhookHandler);

/**
 * Check payment status
 * GET /api/payments/:orderId/status
 */
router.get(
  "/:orderId/status",
  requireAuth,
  validate(
    z.object({
      body: z.any().optional(),
      params: z.object({ orderId: z.string().min(1) }),
      query: z.object({}).optional(),
    })
  ),
  ctrl.checkPaymentStatus
);

/**
 * VNPay initiate
 * POST /api/payments/vnpay/initiate
 */
router.post(
  "/vnpay/initiate",
  requireCsrf,
  requireAuth,
  validate(
    z.object({
      body: z.object({
        orderId: z.string().min(1),
        returnUrl: z.string().url().optional(),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  ctrl.initiateVnPayPayment
);

/**
 * VNPay return (user redirect)
 * GET /api/payments/vnpay/return
 */
router.get("/vnpay/return", ctrl.vnpayReturnHandler);

/**
 * VNPay IPN (server-to-server) - no auth / no CSRF
 * POST /api/payments/vnpay/ipn
 */
router.post("/vnpay/ipn", ctrl.vnpayIpnHandler);
router.get("/vnpay/ipn", ctrl.vnpayIpnHandler);

module.exports = router;
