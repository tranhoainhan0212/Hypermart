const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    imageUrl: { type: String, default: "" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [orderItemSchema], required: true },

    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String, default: "" },
      city: { type: String, required: true },
      province: { type: String, required: true },
      postalCode: { type: String, default: "" },
      country: { type: String, default: "VN" },
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "PAYPAL", "MOMO", "VNPAY"],
      default: "COD",
      required: true,
    },
    paymentStatus: { type: String, enum: ["unpaid", "paid", "refunded"], default: "unpaid" },

    // Momo payment tracking
    momoTransactionId: { type: String, default: null },
    momoRequestId: { type: String, default: null },
    // VNPay tracking
    vnpTxnRef: { type: String, default: null },
    vnpTransactionNo: { type: String, default: null },
    vnpResponseCode: { type: String, default: null },

    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "shipping", "completed", "cancelled"],
      default: "pending",
      index: true,
    },

    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);

