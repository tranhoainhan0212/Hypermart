const crypto = require("crypto");
const axios = require("axios");

/**
 * Momo Payment Service
 * Environment variables needed:
 * - MOMO_PARTNER_CODE: Your Momo partner code
 * - MOMO_ACCESS_KEY: Your Momo access key
 * - MOMO_SECRET_KEY: Your Momo secret key
 * - MOMO_WEBHOOK_URL: Webhook URL for payment callback (e.g., https://yourdomain.com/api/payments/momo/webhook)
 * - NODE_ENV: production or development
 */

const MOMO_CONFIG = {
  development: {
    endpoint: "https://test-payment.momo.vn/v2/gateway/api/create",
    checkEndpoint: "https://test-payment.momo.vn/v2/gateway/api/query",
  },
  production: {
    endpoint: "https://payment.momo.vn/v2/gateway/api/create",
    checkEndpoint: "https://payment.momo.vn/v2/gateway/api/query",
  },
};

const env = process.env.NODE_ENV || "development";
const endpoints = MOMO_CONFIG[env] || MOMO_CONFIG.development;

/**
 * Generate random request ID
 */
function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate signature for Momo request
 */
function generateSignature(data, secretKey) {
  const rawData = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join("&");

  return crypto
    .createHmac("sha256", secretKey)
    .update(rawData)
    .digest("hex");
}

/**
 * Create Momo payment request
 * @param {Object} params - Payment parameters
 * @param {string} params.orderId - Order ID from database
 * @param {number} params.amount - Amount in VND
 * @param {string} params.orderInfo - Description/message
 * @param {string} params.returnUrl - URL where user is redirected after payment
 * @returns {Promise<Object>} - Momo payment data with payUrl
 */
async function createPaymentRequest(params) {
  const {
    orderId,
    amount,
    orderInfo,
    returnUrl,
  } = params;

  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  const webhookUrl = process.env.MOMO_WEBHOOK_URL;

  if (!partnerCode || !accessKey || !secretKey) {
    throw new Error("Momo credentials not configured");
  }

  const requestId = generateRequestId();
  const requestType = "captureWallet";
  const extraData = Buffer.from(JSON.stringify({ orderId })).toString("base64");

  const rawSignature = [
    "accessKey=" + accessKey,
    "amount=" + amount,
    "extraData=" + extraData,
    "orderId=" + orderId,
    "orderInfo=" + orderInfo,
    "partnerCode=" + partnerCode,
    "redirectUrl=" + returnUrl,
    "requestId=" + requestId,
    "requestType=" + requestType,
  ].join("&");

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const requestBody = {
    partnerCode,
    partnerName: "eCommerce",
    storeId: process.env.MOMO_STORE_ID || "MomoStore",
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl: returnUrl,
    ipnUrl: webhookUrl,
    requestType,
    autoCapture: true,
    extraData,
    signature,
    lang: "vi",
  };

  try {
    const response = await axios.post(endpoints.endpoint, requestBody, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });

    return {
      requestId,
      orderId,
      payUrl: response.data.payUrl,
      resultCode: response.data.resultCode,
      message: response.data.message,
      momoTransactionId: response.data.transId,
    };
  } catch (error) {
    throw new Error(
      `Momo payment request failed: ${error.response?.data?.message || error.message}`
    );
  }
}

/**
 * Verify webhook signature from Momo
 */
function verifyWebhookSignature(data, signature) {
  const secretKey = process.env.MOMO_SECRET_KEY;
  if (!secretKey) throw new Error("Momo secret key not configured");

  const rawData = [
    `amount=${data.amount}`,
    `extraData=${data.extraData}`,
    `message=${data.message}`,
    `orderId=${data.orderId}`,
    `orderInfo=${data.orderInfo}`,
    `orderType=${data.orderType}`,
    `partnerCode=${data.partnerCode}`,
    `payType=${data.payType}`,
    `requestId=${data.requestId}`,
    `responseTime=${data.responseTime}`,
    `resultCode=${data.resultCode}`,
    `transId=${data.transId}`,
  ].join("&");

  const expectedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(rawData)
    .digest("hex");

  return signature === expectedSignature;
}

/**
 * Check payment status (query transaction)
 */
async function checkPaymentStatus(orderId, requestId) {
  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;

  if (!partnerCode || !accessKey || !secretKey) {
    throw new Error("Momo credentials not configured");
  }

  const rawSignature = [
    "accessKey=" + accessKey,
    "orderId=" + orderId,
    "partnerCode=" + partnerCode,
    "requestId=" + requestId,
  ].join("&");

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const requestBody = {
    partnerCode,
    requestId,
    orderId,
    accessKey,
    signature,
    lang: "vi",
  };

  try {
    const response = await axios.post(endpoints.checkEndpoint, requestBody, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      `Payment status check failed: ${error.response?.data?.message || error.message}`
    );
  }
}

module.exports = {
  createPaymentRequest,
  verifyWebhookSignature,
  checkPaymentStatus,
  generateRequestId,
};
