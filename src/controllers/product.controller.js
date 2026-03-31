const Product = require("../models/Product");
const Category = require("../models/Category");
const { HttpError } = require("../utils/httpError");
const { slugify } = require("../utils/slugify");

function toNumber(v) {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

async function listProducts(req, res) {
  const q = req.validated.query.q;
  const category = req.validated.query.category;
  const minPrice = toNumber(req.validated.query.minPrice);
  const maxPrice = toNumber(req.validated.query.maxPrice);
  const minRating = toNumber(req.validated.query.minRating);
  const page = Math.max(1, toNumber(req.validated.query.page) || 1);
  const limit = Math.min(60, Math.max(1, toNumber(req.validated.query.limit) || 12));
  const sort = req.validated.query.sort || "newest";

  const filter = {};
  if (q) filter.$text = { $search: q };
  if (category) filter.category = category;
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }
  if (minRating !== undefined) filter.ratingAverage = { $gte: minRating };

  let sortSpec = { createdAt: -1 };
  if (sort === "price_asc") sortSpec = { price: 1 };
  if (sort === "price_desc") sortSpec = { price: -1 };
  if (sort === "rating_desc") sortSpec = { ratingAverage: -1, ratingCount: -1 };

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .sort(sortSpec)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

async function getProduct(req, res) {
  const { idOrSlug } = req.validated.params;
  const item = await Product.findOne(
    idOrSlug.match(/^[0-9a-fA-F]{24}$/) ? { _id: idOrSlug } : { slug: idOrSlug }
  )
    .populate("category", "name slug")
    .lean();
  if (!item) throw new HttpError(404, "Product not found");
  res.json({ item });
}

async function createProduct(req, res) {
  const { name, description, price, stock, categoryId, images } = req.validated.body;

  const category = await Category.findById(categoryId);
  if (!category) throw new HttpError(400, "Invalid categoryId");

  const slug = slugify(name);
  if (!slug) throw new HttpError(400, "Invalid product name");
  const dup = await Product.findOne({ slug });
  if (dup) throw new HttpError(409, "Product already exists");

  // Normalize images: add order and ensure one is primary
  let normalizedImages = (images || []).map((img, idx) => ({
    url: img.url,
    alt: img.alt || "",
    order: img.order ?? idx,
    isPrimary: img.isPrimary ?? (idx === 0),
  }));

  // Ensure only one primary image
  const primaryCount = normalizedImages.filter((i) => i.isPrimary).length;
  if (normalizedImages.length > 0 && primaryCount === 0) {
    normalizedImages[0].isPrimary = true;
  } else if (primaryCount > 1) {
    const first = normalizedImages.find((i) => i.isPrimary);
    normalizedImages = normalizedImages.map((i) => ({ ...i, isPrimary: i === first }));
  }

  const created = await Product.create({
    name,
    slug,
    description: description || "",
    price,
    stock,
    category: categoryId,
    images: normalizedImages,
  });

  res.status(201).json({ item: created });
}

async function updateProduct(req, res) {
  const { id } = req.validated.params;
  const { name, description, price, stock, categoryId, images } = req.validated.body;

  const updates = {};
  if (name !== undefined) {
    const slug = slugify(name);
    if (!slug) throw new HttpError(400, "Invalid product name");
    const dup = await Product.findOne({ slug, _id: { $ne: id } });
    if (dup) throw new HttpError(409, "Product slug already used");
    updates.name = name;
    updates.slug = slug;
  }
  if (description !== undefined) updates.description = description;
  if (price !== undefined) updates.price = price;
  if (stock !== undefined) updates.stock = stock;
  if (categoryId !== undefined) {
    const category = await Category.findById(categoryId);
    if (!category) throw new HttpError(400, "Invalid categoryId");
    updates.category = categoryId;
  }
  if (images !== undefined) {
    // Normalize images
    let normalizedImages = images.map((img, idx) => ({
      url: img.url,
      alt: img.alt || "",
      order: img.order ?? idx,
      isPrimary: img.isPrimary ?? (idx === 0),
    }));

    // Ensure only one primary image
    const primaryCount = normalizedImages.filter((i) => i.isPrimary).length;
    if (normalizedImages.length > 0 && primaryCount === 0) {
      normalizedImages[0].isPrimary = true;
    } else if (primaryCount > 1) {
      const first = normalizedImages.find((i) => i.isPrimary);
      normalizedImages = normalizedImages.map((i) => ({ ...i, isPrimary: i === first }));
    }

    updates.images = normalizedImages;
  }

  const updated = await Product.findByIdAndUpdate(id, updates, { new: true });
  if (!updated) throw new HttpError(404, "Product not found");
  res.json({ item: updated });
}

async function deleteProduct(req, res) {
  const { id } = req.validated.params;
  const deleted = await Product.findByIdAndDelete(id);
  if (!deleted) throw new HttpError(404, "Product not found");
  res.json({ ok: true });
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};

