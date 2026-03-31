const User = require("../models/User");
const Product = require("../models/Product");
const { HttpError } = require("../utils/httpError");

async function getMyCart(req, res) {
  const user = await User.findById(req.user._id)
    .populate("cart.items.product", "name price stock images slug")
    .lean();
  res.json({ cart: user?.cart || { items: [], updatedAt: null } });
}

async function setMyCart(req, res) {
  const { items } = req.validated.body;

  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await Product.find({ _id: { $in: productIds } })
    .select("price stock")
    .lean();
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const normalized = items.map((i) => {
    const p = byId.get(i.productId);
    if (!p) throw new HttpError(400, `Invalid productId: ${i.productId}`);
    if (i.quantity > p.stock) throw new HttpError(400, "Quantity exceeds stock");
    return { product: i.productId, quantity: i.quantity };
  });

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { cart: { items: normalized, updatedAt: new Date() } },
    { new: true }
  )
    .populate("cart.items.product", "name price stock images slug")
    .lean();

  res.json({ cart: updated.cart });
}

async function clearMyCart(req, res) {
  await User.findByIdAndUpdate(req.user._id, {
    cart: { items: [], updatedAt: new Date() },
  });
  res.json({ ok: true });
}

module.exports = { getMyCart, setMyCart, clearMyCart };

