/**
 * create_test_order.js
 * Create a minimal test Order document in MongoDB and print its _id.
 * Usage: node scripts/create_test_order.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Order = require("../src/models/Order");

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const order = await Order.create({
      user: new mongoose.Types.ObjectId(),
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          name: "Test Product",
          price: 100000,
          quantity: 1,
          imageUrl: "",
        },
      ],
      shippingAddress: {
        fullName: "Test User",
        phone: "0123456789",
        addressLine1: "123 Test St",
        addressLine2: "",
        city: "Hanoi",
        province: "HN",
        postalCode: "100000",
      },
      paymentMethod: "VNPAY",
      subtotal: 100000,
      shippingFee: 0,
      total: 100000,
    });

    console.log("Created test order id:", order._id.toString());
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Failed to create test order:", err);
    process.exit(1);
  }
}

run();
