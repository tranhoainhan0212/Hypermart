const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const { HttpError } = require("../utils/httpError");

async function createOrderFromCart(req, res) {
  const { shippingAddress, paymentMethod } = req.validated.body;

  const user = await User.findById(req.user._id).select("cart").lean();
  const cartItems = user?.cart?.items || [];
  if (cartItems.length === 0) throw new HttpError(400, "Cart is empty");

  const productIds = cartItems.map((i) => i.product.toString());
  const products = await Product.find({ _id: { $in: productIds } })
    .select("name price stock images")
    .lean();
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const orderItems = [];
  let subtotal = 0;

  for (const ci of cartItems) {
    const p = byId.get(ci.product.toString());
    if (!p) throw new HttpError(400, "Product not found in cart");
    if (ci.quantity > p.stock) throw new HttpError(400, `Out of stock: ${p.name}`);
    const imageUrl = p.images?.[0]?.url || "";
    orderItems.push({
      product: p._id,
      name: p.name,
      price: p.price,
      quantity: ci.quantity,
      imageUrl,
    });
    subtotal += p.price * ci.quantity;
  }

  const shippingFee = 0;
  const total = subtotal + shippingFee;

  const session = await mongoose.startSession();
  try {
    let created;
    await session.withTransaction(async () => {
      // decrement stock
      for (const item of orderItems) {
        const r = await Product.updateOne(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { session }
        );
        if (r.modifiedCount !== 1) throw new HttpError(409, "Stock changed, please retry");
      }

      created = await Order.create(
        [
          {
            user: req.user._id,
            items: orderItems,
            shippingAddress,
            paymentMethod,
            subtotal,
            shippingFee,
            total,
          },
        ],
        { session }
      );

      await User.updateOne(
        { _id: req.user._id },
        { cart: { items: [], updatedAt: new Date() } },
        { session }
      );
    });

    res.status(201).json({ item: created[0] });
  } finally {
    session.endSession();
  }
}

async function listMyOrders(req, res) {
  const page = Math.max(1, Number(req.validated.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.validated.query.limit || 10)));

  const [items, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments({ user: req.user._id }),
  ]);

  res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
}

async function getMyOrder(req, res) {
  const { id } = req.validated.params;
  const item = await Order.findOne({ _id: id, user: req.user._id }).lean();
  if (!item) throw new HttpError(404, "Order not found");
  res.json({ item });
}

async function adminListOrders(req, res) {
  const status = req.validated.query.status;
  const page = Math.max(1, Number(req.validated.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.validated.query.limit || 10)));

  const filter = {};
  if (status) filter.orderStatus = status;

  const [items, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "email name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
}

async function adminUpdateOrderStatus(req, res) {
  const { id } = req.validated.params;
  const { orderStatus } = req.validated.body;
  const updated = await Order.findByIdAndUpdate(id, { orderStatus }, { new: true });
  if (!updated) throw new HttpError(404, "Order not found");
  res.json({ item: updated });
}

module.exports = {
  createOrderFromCart,
  listMyOrders,
  getMyOrder,
  adminListOrders,
  adminUpdateOrderStatus,
};

