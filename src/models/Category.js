const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
  },
  { timestamps: true }
);

categorySchema.index({ slug: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);

