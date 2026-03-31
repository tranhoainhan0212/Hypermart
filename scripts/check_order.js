require("dotenv").config();
const mongoose = require("mongoose");
const Order = require("../src/models/Order");

async function run() {
  const id = process.argv[2];
  if (!id) {
    console.error("Usage: node scripts/check_order.js <orderId>");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    const order = await Order.findById(id).lean();
    if (!order) {
      console.log("Order not found");
      process.exit(0);
    }
    console.log({ _id: order._id.toString(), paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus, orderStatus: order.orderStatus, vnpTxnRef: order.vnpTxnRef, vnpTransactionNo: order.vnpTransactionNo, vnpResponseCode: order.vnpResponseCode });
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
