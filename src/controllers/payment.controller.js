const Order = require("../models/Order");
const { HttpError } = require("../utils/httpError");
const momoService = require("../services/momo");
const vnpayService = require("../services/vnpay");
const { getPrimaryClientOrigin } = require("../config/runtime");

async function initiateMomoPayment(req, res) {
  const { orderId, returnUrl } = req.validated.body;

  const order = await Order.findById(orderId);
  if (!order) throw new HttpError(404, "Order not found");

  if (order.user.toString() !== req.user._id.toString()) {
    throw new HttpError(403, "Unauthorized");
  }

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
      returnUrl: returnUrl || `${getPrimaryClientOrigin()}/orders/${orderId}?payment=success`,
    });

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

async function momoWebhookHandler(req, res) {
  try {
    const webhookData = req.body;
    const signature = req.headers["x-momo-signature"] || req.body.signature;
    if (!signature) {
      return res.status(400).json({ resultCode: 1, message: "Missing signature" });
    }

    const isValid = momoService.verifyWebhookSignature(webhookData, signature);
    if (!isValid) {
      console.warn("Invalid Momo webhook signature");
      return res.status(403).json({ resultCode: 1, message: "Invalid signature" });
    }

    let orderId;
    try {
      const extraDataJson = JSON.parse(Buffer.from(webhookData.extraData, "base64").toString());
      orderId = extraDataJson.orderId;
    } catch (e) {
      console.error("Failed to parse Momo extraData:", e);
      return res.status(400).json({ resultCode: 1, message: "Invalid extraData" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ resultCode: 1, message: "Order not found" });
    }

    if (webhookData.resultCode === 0) {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "paid",
        orderStatus: "confirmed",
        momoTransactionId: webhookData.transId,
      });

      res.json({ resultCode: 0, message: "Payment confirmed" });
    } else if (webhookData.resultCode === 1) {
      res.json({ resultCode: 0, message: "Payment cancelled" });
    } else {
      console.error(`Momo payment error for order ${orderId}:`, webhookData);
      res.json({ resultCode: 0, message: "Payment processing failed" });
    }
  } catch (error) {
    console.error("Momo webhook processing error:", error);
    res.status(500).json({ resultCode: 99, message: "Internal server error" });
  }
}

async function initiateVnPayPayment(req, res) {
  const { orderId, returnUrl } = req.validated.body;

  const order = await Order.findById(orderId);
  if (!order) throw new HttpError(404, "Order not found");

  if (order.user.toString() !== req.user._id.toString()) {
    throw new HttpError(403, "Unauthorized");
  }

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
      returnUrl: returnUrl || `${getPrimaryClientOrigin()}/orders/${orderId}?payment=success`,
    });

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

async function vnpayReturnHandler(req, res) {
  try {
    const valid = vnpayService.verifyReturn(req.query);
    const txnRef = req.query.vnp_TxnRef;

    const clientOrigin = getPrimaryClientOrigin();
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
      await Order.findByIdAndUpdate(txnRef, {
        paymentStatus: "paid",
        orderStatus: "confirmed",
        vnpTransactionNo: req.query.vnp_TransactionNo || "",
      });
      return res.redirect(`${redirectBase}?result=success`);
    }

    return res.redirect(`${redirectBase}?result=failed&code=${respCode || "unknown"}`);
  } catch (error) {
    console.error("VNPay return processing error:", error);
    res.status(500).send("Internal server error");
  }
}

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

    await Order.findByIdAndUpdate(txnRef, {
      vnpTxnRef: data.vnp_TxnRef,
      vnpTransactionNo: data.vnp_TransactionNo || "",
      vnpResponseCode: respCode || "",
    });

    if (respCode === "00") {
      if (order.paymentStatus !== "paid") {
        await Order.findByIdAndUpdate(txnRef, { paymentStatus: "paid", orderStatus: "confirmed" });
      }
      return res.json({ RspCode: "00", Message: "Confirm Success" });
    }

    return res.json({ RspCode: "02", Message: "Payment failed" });
  } catch (error) {
    console.error("VNPay IPN processing error:", error);
    return res.status(500).json({ RspCode: "99", Message: "Internal Server Error" });
  }
}

async function checkPaymentStatus(req, res) {
  const { orderId } = req.validated.params;

  const order = await Order.findById(orderId);
  if (!order) throw new HttpError(404, "Order not found");

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
