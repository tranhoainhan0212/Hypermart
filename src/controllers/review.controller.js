const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");
const { HttpError } = require("../utils/httpError");

async function recalcProductRating(productId) {
  const [agg] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$product",
        ratingAverage: { $avg: "$rating" },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  const ratingAverage = agg ? Number(agg.ratingAverage.toFixed(2)) : 0;
  const ratingCount = agg ? agg.ratingCount : 0;

  await Product.findByIdAndUpdate(productId, { ratingAverage, ratingCount });
}

async function listReviews(req, res) {
  const { productId } = req.validated.query;
  const page = Math.max(1, Number(req.validated.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.validated.query.limit || 10)));

  const filter = {};
  if (productId) filter.product = productId;

  const [items, total] = await Promise.all([
    Review.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
}

async function createOrUpdateMyReview(req, res) {
  const { productId, rating, comment } = req.validated.body;
  const product = await Product.findById(productId).select("_id");
  if (!product) throw new HttpError(404, "Product not found");

  const doc = await Review.findOneAndUpdate(
    { product: productId, user: req.user._id },
    { rating, comment: comment || "" },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await recalcProductRating(productId);

  res.status(201).json({ item: doc });
}

async function deleteMyReview(req, res) {
  const { id } = req.validated.params;
  const doc = await Review.findOneAndDelete({ _id: id, user: req.user._id });
  if (!doc) throw new HttpError(404, "Review not found");

  await recalcProductRating(doc.product);

  res.json({ ok: true });
}

async function adminDeleteReview(req, res) {
  const { id } = req.validated.params;
  const doc = await Review.findByIdAndDelete(id);
  if (!doc) throw new HttpError(404, "Review not found");

  await recalcProductRating(doc.product);
  res.json({ ok: true });
}

module.exports = {
  listReviews,
  createOrUpdateMyReview,
  deleteMyReview,
  adminDeleteReview,
};

