const Order = require("../models/Order");
const { HttpError } = require("../utils/httpError");
const momoService = require("../services/momo");
const vnpayService = require("../services/vnpay");

/**
 * Initiate Momo payment for an order
 * POST /api/payments/momo/initiate
 */
async function initiateMomoPayment(req, res) {
  const { orderId, returnUrl } = req.validated.body;

  const order = await Order.findById(orderId);
  if (!order) throw new HttpError(404, "Order not found");

  // Verify order belongs to current user
  if (order.user.toString() !== req.user._id.toString()) {
    throw new HttpError(403, "Unauthorized");
  }

  // Only allow payment if order is pending and unpaid
  if (order.orderStatus !== "pending") {
    throw new HttpError(400, "Order cannot be paid at this stage");
  }
  if (order.paymentStatus !== "unpaid") {
    throw new HttpError(400, "Order already paid or refunded");
  }

  try {
    const paymentData = await momoService.createPaymentRequest({
      orderId: orderId.toString(),
      amount: Math.round(order.total),
      orderInfo: `Payment for Order #${orderId.toString().slice(-6)}`,
      returnUrl: returnUrl || `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/orders/${orderId}?payment=success`,
    });

    // Save Momo transaction ID to order for webhook verification
    await Order.findByIdAndUpdate(orderId, {
      momoTransactionId: paymentData.momoTransactionId,
      momoRequestId: paymentData.requestId,
    });

    res.json({
      payUrl: paymentData.payUrl,
      requestId: paymentData.requestId,
      transactionId: paymentData.momoTransactionId,
      message: "Payment request created successfully",
    });
  } catch (error) {
    throw new HttpError(500, error.message || "Failed to create payment request");
  }
}

/**
 * Handle Momo webhook callback
 * POST /api/payments/momo/webhook
 * This endpoint should NOT require CSRF or auth - it's called by Momo servers
 */
async function momoWebhookHandler(req, res) {
  try {
    const webhookData = req.body;

    // Verify webhook signature
    const signature = req.headers["x-momo-signature"] || req.body.signature;
    if (!signature) {
      return res.status(400).json({ resultCode: 1, message: "Missing signature" });
    }

    const isValid = momoService.verifyWebhookSignature(webhookData, signature);
    if (!isValid) {
      console.warn("Invalid Momo webhook signature");
      return res.status(403).json({ resultCode: 1, message: "Invalid signature" });
    }

    // Extract order ID from extraData
    let orderId;
    try {
      const extraDataJson = JSON.parse(
        Buffer.from(webhookData.extraData, "base64").toString()
      );
      orderId = extraDataJson.orderId;
    } catch (e) {
      console.error("Failed to parse Momo extraData:", e);
      return res.status(400).json({ resultCode: 1, message: "Invalid extraData" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ resultCode: 1, message: "Order not found" });
    }

    // Check payment result code
    // Momo result codes:
    // 0 = Success
    // 1 = Payer cancelled (user closed window before completing)
    // Other numbers = Various errors
    if (webhookData.resultCode === 0) {
      // Payment successful
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "paid",
        orderStatus: "confirmed",
        momoTransactionId: webhookData.transId,
      });

      res.json({ resultCode: 0, message: "Payment confirmed" });
    } else if (webhookData.resultCode === 1) {
      // Payer cancelled
      res.json({ resultCode: 0, message: "Payment cancelled" });
    } else {
      // Other errors
      console.error(`Momo payment error for order ${orderId}:`, webhookData);
      res.json({ resultCode: 0, message: "Payment processing failed" });
    }
  } catch (error) {
    console.error("Momo webhook processing error:", error);
    res.status(500).json({ resultCode: 99, message: "Internal server error" });
  }
}

/**
 * Initiate VNPay payment for an order
 * POST /api/payments/vnpay/initiate
 */
async function initiateVnPayPayment(req, res) {
  const { orderId, returnUrl } = req.validated.body;

  const order = await Order.findById(orderId);
  if (!order) throw new HttpError(404, "Order not found");

  // Verify order belongs to current user
  if (order.user.toString() !== req.user._id.toString()) {
    throw new HttpError(403, "Unauthorized");
  }

  // Only allow payment if order is pending and unpaid
  if (order.orderStatus !== "pending") {
    throw new HttpError(400, "Order cannot be paid at this stage");
  }
  if (order.paymentStatus !== "unpaid") {
    throw new HttpError(400, "Order already paid or refunded");
  }

  try {
    const paymentData = vnpayService.createPaymentUrl({
      req,
      orderId: orderId.toString(),
      amount: Math.round(order.total),
      orderInfo: `Payment for Order #${orderId.toString().slice(-6)}`,
      returnUrl: returnUrl || `${(process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",")[0].trim()}/orders/${orderId}?payment=success`,
    });

    // Save vnp txn ref on order for reference (optional)
    await Order.findByIdAndUpdate(orderId, {
      vnpTxnRef: paymentData.vnp_TxnRef,
    });

    res.json({
      payUrl: paymentData.payUrl,
      vnpTxnRef: paymentData.vnp_TxnRef,
      message: "VNPay payment URL created",
    });
  } catch (error) {
    throw new HttpError(500, error.message || "Failed to create VNPay payment request");
  }
}

/**
 * VNPay return handler (user redirected back)
 * GET /api/payments/vnpay/return
 */
async function vnpayReturnHandler(req, res) {
  try {
    const valid = vnpayService.verifyReturn(req.query);
    const txnRef = req.query.vnp_TxnRef;

    const clientOrigin = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",")[0];
    const redirectBase = `${clientOrigin}/orders/${txnRef}/payment`;

    if (!valid) {
      console.warn("Invalid VNPay signature for", txnRef);
      return res.redirect(`${redirectBase}?result=failed&message=invalid_signature`);
    }

    const order = await Order.findById(txnRef);
    if (!order) {
      return res.redirect(`${redirectBase}?result=failed&message=order_not_found`);
    }

    const respCode = req.query.vnp_ResponseCode;
    if (respCode === "00") {
      // success
      await Order.findByIdAndUpdate(txnRef, {
        paymentStatus: "paid",
        orderStatus: "confirmed",
        vnpTransactionNo: req.query.vnp_TransactionNo || "",
      });
      return res.redirect(`${redirectBase}?result=success`);
    }

    // not success
    return res.redirect(`${redirectBase}?result=failed&code=${respCode || "unknown"}`);
  } catch (error) {
    console.error("VNPay return processing error:", error);
    res.status(500).send("Internal server error");
  }
}

/**
 * VNPay IPN / webhook handler (server-to-server)
 * POST or GET /api/payments/vnpay/ipn
 * This endpoint should NOT require CSRF or auth - called by VNPay servers
 */
async function vnpayIpnHandler(req, res) {
  try {
    const data = req.method === "GET" ? req.query : req.body;

    const isValid = vnpayService.verifyReturn(data);
    const txnRef = data.vnp_TxnRef;

    if (!isValid) {
      console.warn("Invalid VNPay IPN signature for", txnRef);
      return res.json({ RspCode: "97", Message: "Invalid signature" });
    }

    const order = await Order.findById(txnRef);
    if (!order) {
      console.warn("VNPay IPN: order not found", txnRef);
      return res.json({ RspCode: "01", Message: "Order not found" });
    }

    const respCode = data.vnp_ResponseCode;

    // Persist VNPay fields for tracing
    await Order.findByIdAndUpdate(txnRef, {
      vnpTxnRef: data.vnp_TxnRef,
      vnpTransactionNo: data.vnp_TransactionNo || "",
      vnpResponseCode: respCode || "",
    });

    if (respCode === "00") {
      // mark paid if not already
      if (order.paymentStatus !== "paid") {
        await Order.findByIdAndUpdate(txnRef, { paymentStatus: "paid", orderStatus: "confirmed" });
      }
      return res.json({ RspCode: "00", Message: "Confirm Success" });
    }

    // Payment not successful
    return res.json({ RspCode: "02", Message: "Payment failed" });
  } catch (error) {
    console.error("VNPay IPN processing error:", error);
    return res.status(500).json({ RspCode: "99", Message: "Internal Server Error" });
  }
}

/**
 * Check payment status
 * GET /api/payments/:orderId/status
 */
async function checkPaymentStatus(req, res) {
  const { orderId } = req.validated.params;

  const order = await Order.findById(orderId);
  if (!order) throw new HttpError(404, "Order not found");

  // Verify order belongs to current user
  if (order.user.toString() !== req.user._id.toString()) {
    throw new HttpError(403, "Unauthorized");
  }

  res.json({
    orderId,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    amount: order.total,
    orderStatus: order.orderStatus,
  });
}

module.exports = {
  initiateMomoPayment,
  momoWebhookHandler,
  initiateVnPayPayment,
  vnpayReturnHandler,
  vnpayIpnHandler,
  checkPaymentStatus,
};