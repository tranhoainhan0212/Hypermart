const Order = require("../models/Order");
const User = require("../models/User");
const { HttpError } = require("../utils/httpError");

async function dashboardStats(_req, res) {
  const [totalUsers, totalOrders, revenueAgg] = await Promise.all([
    User.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { orderStatus: { $in: ["confirmed", "shipping", "completed"] } } },
      { $group: { _id: null, revenue: { $sum: "$total" } } },
    ]),
  ]);

  const totalRevenue = revenueAgg?.[0]?.revenue || 0;
  res.json({ totalRevenue, totalOrders, totalUsers });
}

// User Management
async function listUsers(req, res) {
  const page = Math.max(1, Number(req.validated.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.validated.query.limit || 20)));
  const search = req.validated.query.search || "";
  const role = req.validated.query.role;

  const filter = {};
  if (search) {
    filter.$or = [
      { email: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
    ];
  }
  if (role && ["user", "admin"].includes(role)) {
    filter.role = role;
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("email name role isBanned isEmailVerified createdAt"),
    User.countDocuments(filter),
  ]);

  res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
}

async function banUser(req, res) {
  const { userId } = req.validated.params;
  const { reason } = req.validated.body;

  const user = await User.findByIdAndUpdate(
    userId,
    {
      isBanned: true,
      bannedReason: reason || "",
      bannedAt: new Date(),
    },
    { new: true }
  ).select("email name isBanned");

  if (!user) throw new HttpError(404, "User not found");
  res.json({ item: user });
}

async function unbanUser(req, res) {
  const { userId } = req.validated.params;

  const user = await User.findByIdAndUpdate(
    userId,
    {
      isBanned: false,
      bannedReason: "",
      bannedAt: null,
    },
    { new: true }
  ).select("email name isBanned");

  if (!user) throw new HttpError(404, "User not found");
  res.json({ item: user });
}

async function changeUserRole(req, res) {
  const { userId } = req.validated.params;
  const { role } = req.validated.body;

  if (!["user", "admin"].includes(role)) {
    throw new HttpError(400, "Invalid role");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true }
  ).select("email name role");

  if (!user) throw new HttpError(404, "User not found");
  res.json({ item: user });
}

async function deleteUser(req, res) {
  const { userId } = req.validated.params;

  const user = await User.findById(userId);
  if (!user) throw new HttpError(404, "User not found");

  // Delete user and related data
  await Promise.all([
    User.deleteOne({ _id: userId }),
    Order.deleteMany({ user: userId }),
  ]);

  res.json({ ok: true });
}

module.exports = {
  dashboardStats,
  listUsers,
  banUser,
  unbanUser,
  changeUserRole,
  deleteUser,
};

