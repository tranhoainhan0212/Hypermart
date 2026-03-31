#!/usr/bin/env node
/**
 * send_vnpay_ipn.js
 * Simple script to simulate a VNPay IPN (server-to-server) call to the local backend.
 * Usage:
 *   node scripts/send_vnpay_ipn.js txnRef=test123 amount=100000 host=http://localhost:3000
 * Or set env vars: VNPAY_TMN_CODE, VNPAY_HASH_SECRET
 */

const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

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

const args = {};
process.argv.slice(2).forEach((a) => {
  if (a.includes("=")) {
    const [k, v] = a.split("=");
    args[k.replace(/^--/, "")] = v;
  }
});

const host = args.host || process.env.HOST || "http://localhost:3000";
const txnRef = args.txnRef || args.txn || process.env.TXN_REF || "test-order-001";
const amount = Number(args.amount || process.env.AMOUNT || 100000);

const payload = {
  vnp_Version: "2.1.0",
  vnp_Command: "pay",
  vnp_TmnCode: process.env.VNPAY_TMN_CODE || "TEST",
  vnp_TxnRef: txnRef,
  vnp_Amount: String(Math.round(amount) * 100),
  vnp_OrderInfo: `Test IPN for ${txnRef}`,
  vnp_ResponseCode: "00",
  vnp_TransactionNo: "123456789",
  vnp_CreateDate: formatDate(new Date()),
  vnp_CurrCode: "VND",
};

const sortedKeys = Object.keys(payload).sort();
const signData = sortedKeys.map((k) => `${k}=${payload[k]}`).join("&");
const secret = process.env.VNPAY_HASH_SECRET || "";
const secureHash = crypto.createHmac("sha512", secret).update(signData).digest("hex");

payload.vnp_SecureHash = secureHash;
payload.vnp_SecureHashType = "SHA512";

async function send() {
  try {
    console.log("Sending simulated VNPay IPN to", `${host}/api/payments/vnpay/ipn`);
    console.log("Payload sample:", { vnp_TxnRef: payload.vnp_TxnRef, vnp_Amount: payload.vnp_Amount });
    const res = await axios.post(`${host}/api/payments/vnpay/ipn`, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
    console.log("Response status:", res.status);
    console.log("Response data:", res.data);
  } catch (err) {
    console.error("IPN send error:", err.response ? err.response.data : err.message);
  }
}

send();
