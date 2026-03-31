const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, select: false }, // Optional - for OAuth users
    passwordHash: { type: String, select: false },
    name: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    verified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false, index: true },
    bannedReason: { type: String, default: "" },
    bannedAt: { type: Date, default: null },

    // OAuth IDs
    googleId: { type: String, default: null, sparse: true },
    facebookId: { type: String, default: null, sparse: true },

    refreshTokenHash: { type: String, select: false, default: null },

    resetPasswordTokenHash: { type: String, select: false, default: null },
    resetPasswordExpiresAt: { type: Date, select: false, default: null },

    cart: {
      items: [
        {
          product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
          quantity: { type: Number, required: true, min: 1, max: 999 },
        },
      ],
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

