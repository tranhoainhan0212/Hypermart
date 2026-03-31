const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "" },

    images: [imageSchema],

    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },

    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },

    ratingAverage: { type: Number, min: 0, max: 5, default: 0 },
    ratingCount: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ name: "text", description: "text" });
productSchema.index({ category: 1, price: 1, ratingAverage: -1 });

module.exports = mongoose.model("Product", productSchema);

