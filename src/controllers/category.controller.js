const Category = require("../models/Category");
const { HttpError } = require("../utils/httpError");
const { slugify } = require("../utils/slugify");

async function listCategories(_req, res) {
  const items = await Category.find().sort({ name: 1 }).lean();
  res.json({ items });
}

async function createCategory(req, res) {
  const { name } = req.validated.body;
  const slug = slugify(name);
  if (!slug) throw new HttpError(400, "Invalid category name");

  const exists = await Category.findOne({ slug });
  if (exists) throw new HttpError(409, "Category already exists");

  const created = await Category.create({ name, slug });
  res.status(201).json({ item: created });
}

async function updateCategory(req, res) {
  const { id } = req.validated.params;
  const { name } = req.validated.body;
  const slug = slugify(name);
  if (!slug) throw new HttpError(400, "Invalid category name");

  const dup = await Category.findOne({ slug, _id: { $ne: id } });
  if (dup) throw new HttpError(409, "Category slug already used");

  const updated = await Category.findByIdAndUpdate(
    id,
    { name, slug },
    { new: true }
  );
  if (!updated) throw new HttpError(404, "Category not found");
  res.json({ item: updated });
}

async function deleteCategory(req, res) {
  const { id } = req.validated.params;
  const deleted = await Category.findByIdAndDelete(id);
  if (!deleted) throw new HttpError(404, "Category not found");
  res.json({ ok: true });
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };

