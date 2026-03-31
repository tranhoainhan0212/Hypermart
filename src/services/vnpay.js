const crypto = require("crypto");
const qs = require("qs");

/**
 * VNPay service helper
 * Environment variables required:
 * - VNPAY_TMN_CODE
 * - VNPAY_HASH_SECRET
 * - VNPAY_PAYMENT_URL (optional) - default sandbox URL
 */

const VNPAY_URL =
  process.env.VNPAY_PAYMENT_URL ||
  "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE;
const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET;

function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatDate(d) {
  return (
    d.getFullYear().toString() +
    pad2(d.getMonth() + 1) +
    pad2(d.getDate()) +
    pad2(d.getHours()) +
    pad2(d.getMinutes()) +
    pad2(d.getSeconds())
  );
}

function getClientIp(req) {
  return (
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    "127.0.0.1"
  );
}

/**
 * Create VNPay payment URL
 * amount: number (VND)
 * vnp_TxnRef will be set to orderId (string)
 */
function createPaymentUrl({ req, orderId, amount, orderInfo, returnUrl }) {
  if (!VNPAY_TMN_CODE || !VNPAY_HASH_SECRET) {
    throw new Error("VNPay credentials not configured");
  }

  const ipAddr = req ? getClientIp(req) : "127.0.0.1";
  const createDate = formatDate(new Date());
  const vnp_TxnRef = String(orderId);

  // VNPay yêu cầu amount * 100 (đơn vị: đồng → xu)
  const vnp_Amount = String(Math.round(amount) * 100);

  const params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: VNPAY_TMN_CODE,
    vnp_Amount: vnp_Amount,
    vnp_CurrCode: "VND",
    vnp_TxnRef: vnp_TxnRef,
    vnp_OrderInfo: orderInfo || `Payment for order ${orderId}`,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: returnUrl,
    vnp_CreateDate: createDate,
    vnp_IpAddr: ipAddr,
  };

  // Sort params theo alphabet
  const sortedKeys = Object.keys(params).sort();

  // Tạo chuỗi ký: dùng qs.stringify để encode đúng chuẩn VNPAY
  // VNPAY yêu cầu ký trên chuỗi đã encode (dùng %20 thay khoảng trắng)
  const signData = sortedKeys
    .map((k) => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, "+")}`)
    .join("&");

  const hmac = crypto
    .createHmac("sha512", VNPAY_HASH_SECRET)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  // Tạo query string cho URL (encode chuẩn)
  const query = sortedKeys
    .map(
      (k) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(params[k]).replace(/%20/g, "+")}`
    )
    .join("&");

  const payUrl = `${VNPAY_URL}?${query}&vnp_SecureHash=${hmac}`;

  return {
    payUrl,
    vnp_TxnRef,
  };
}

/**
 * Verify VNPay return query params secure hash
 */
function verifyReturn(query) {
  if (!VNPAY_HASH_SECRET) throw new Error("VNPay secret not configured");

  const data = { ...query };
  const secureHash = data.vnp_SecureHash || "";
  delete data.vnp_SecureHash;
  delete data.vnp_SecureHashType;

  // Sort và tạo chuỗi ký — phải encode giống lúc tạo URL
  const sortedKeys = Object.keys(data).sort();
  const signData = sortedKeys
    .map((k) => `${k}=${encodeURIComponent(data[k]).replace(/%20/g, "+")}`)
    .join("&");

  const expected = crypto
    .createHmac("sha512", VNPAY_HASH_SECRET)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  return expected.toLowerCase() === secureHash.toLowerCase();
}

module.exports = {
  createPaymentUrl,
  verifyReturn,
};