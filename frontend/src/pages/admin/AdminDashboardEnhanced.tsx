import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { api } from "../../services/api";
import { useAppSelector } from "../../hooks/useApp";
import {
  listUsers,
  banUser,
  unbanUser,
  changeUserRole,
  deleteUser,
  type AdminUser,
} from "../../services/admin";
import type { Product } from "../../redux/productsSlice";

type DashboardStats = { totalRevenue: number; totalOrders: number; totalUsers: number };
type CategoryItem = { _id: string; name: string; slug: string };
type AdminOrder = {
  _id: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  user?: any;
};

export default function AdminDashboardPage() {
  const authUser = useAppSelector((s) => s.auth.user);
  const isAdmin = authUser?.role === "admin";

  // Dashboard
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Categories
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [catName, setCatName] = useState("");
  const [catLoading, setCatLoading] = useState(false);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    categoryId: "",
    images: [] as { url: string; alt: string; order: number; isPrimary: boolean }[],
  });

  // Users
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState<"user" | "admin" | undefined>(undefined);

  // Orders
  const [orders, setOrders] = useState<AdminOrder[]>([]);

  // Tabs
  const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "users" | "orders">(
    "dashboard"
  );

  // Load dashboard data
  useEffect(() => {
    if (!isAdmin) return;
    let alive = true;

    async function load() {
      try {
        const [statRes, catRes, prodRes, orderRes, userRes] = await Promise.all([
          api.get("/api/admin/dashboard"),
          api.get("/api/categories"),
          api.get("/api/products", { params: { page: 1, limit: 50 } }),
          api.get("/api/orders", { params: { page: 1, limit: 10 } }),
          listUsers(1, 20, "", undefined),
        ]);

        if (!alive) return;
        setStats(statRes.data as DashboardStats);
        setCategories((catRes.data.items || []) as CategoryItem[]);
        setProducts((prodRes.data.items || []) as Product[]);
        setOrders((orderRes.data.items || []) as AdminOrder[]);
        setUsers(userRes.items);
        setUserTotal(userRes.total);
        setProductForm((p) => ({
          ...p,
          categoryId: (catRes.data.items?.[0]?._id) || "",
        }));
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Failed to load dashboard");
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [isAdmin]);

  // ========== CATEGORY MANAGEMENT ==========
  async function createCategory() {
    if (catName.trim().length < 2) return;
    setCatLoading(true);
    try {
      const res = await api.post("/api/categories", { name: catName });
      setCategories([...categories, res.data.item]);
      setCatName("");
      toast.success("Category created");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create category");
    } finally {
      setCatLoading(false);
    }
  }

  // ========== PRODUCT MANAGEMENT ==========
  async function uploadProductImage() {
    const fileInput = document.getElementById("prod-image-input") as HTMLInputElement;
    if (!fileInput?.files?.[0]) return;

    const formData = new FormData();
    formData.append("image", fileInput.files[0]);

    try {
      const res = await api.post("/api/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newImage = {
        url: res.data.url,
        alt: "",
        order: productForm.images.length,
        isPrimary: productForm.images.length === 0,
      };
      setProductForm((p) => ({ ...p, images: [...p.images, newImage] }));
      toast.success("Image uploaded");
      fileInput.value = "";
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Upload failed");
    }
  }

  function removeProductImage(index: number) {
    setProductForm((p) => {
      const newImages = p.images.filter((_, i) => i !== index);
      // Ensure at least one primary image
      if (newImages.length > 0) {
        newImages[0].isPrimary = true;
      }
      return { ...p, images: newImages };
    });
  }

  function setImagePrimary(index: number) {
    setProductForm((p) => ({
      ...p,
      images: p.images.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      })),
    }));
  }

  function moveImage(index: number, direction: "up" | "down") {
    setProductForm((p) => {
      const newImages = [...p.images];
      const otherIndex = direction === "up" ? index - 1 : index + 1;
      if (otherIndex < 0 || otherIndex >= newImages.length) return p;

      [newImages[index], newImages[otherIndex]] = [newImages[otherIndex], newImages[index]];
      return { ...p, images: newImages.map((img, i) => ({ ...img, order: i })) };
    });
  }

  async function createProduct() {
    if (!productForm.name.trim() || !productForm.categoryId || !productForm.price) {
      toast.error("Fill required fields");
      return;
    }

    setProdLoading(true);
    try {
      const res = await api.post("/api/products", {
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        categoryId: productForm.categoryId,
        images: productForm.images,
      });

      setProducts([...products, res.data.item]);
      setProductForm({
        name: "",
        description: "",
        price: "",
        stock: "",
        categoryId: productForm.categoryId,
        images: [],
      });
      toast.success("Product created");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create product");
    } finally {
      setProdLoading(false);
    }
  }

  // ========== USER MANAGEMENT ==========
  async function loadUsers() {
    try {
      const data = await listUsers(userPage, 20, userSearch, userRole);
      setUsers(data.items);
      setUserTotal(data.total);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load users");
    }
  }

  useEffect(() => {
    if (activeTab === "users") {
      loadUsers();
    }
  }, [userPage, userSearch, userRole, activeTab]);

  async function handleBanUser(userId: string) {
    try {
      await banUser(userId, "Admin ban");
      setUsers(users.map((u) => (u._id === userId ? { ...u, isBanned: true } : u)));
      toast.success("User banned");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to ban user");
    }
  }

  async function handleUnbanUser(userId: string) {
    try {
      await unbanUser(userId);
      setUsers(users.map((u) => (u._id === userId ? { ...u, isBanned: false } : u)));
      toast.success("User unbanned");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to unban user");
    }
  }

  async function handleChangeRole(userId: string, newRole: "user" | "admin") {
    try {
      await changeUserRole(userId, newRole);
      setUsers(users.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
      toast.success("Role updated");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to change role");
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm("Are you sure? This will delete all user data and orders.")) return;

    try {
      await deleteUser(userId);
      setUsers(users.filter((u) => u._id !== userId));
      toast.success("User deleted");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to delete user");
    }
  }

  if (!isAdmin) {
    return <div className="p-6 text-center">Access denied</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            {(
              ["dashboard", "products", "users", "orders"] as const
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium capitalize ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-gray-500 text-sm uppercase">Total Revenue</div>
              <div className="text-3xl font-bold text-gray-900">
                ${stats?.totalRevenue?.toLocaleString() || 0}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-gray-500 text-sm uppercase">Total Orders</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats?.totalOrders || 0}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-gray-500 text-sm uppercase">Total Users</div>
              <div className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="space-y-8">
            {/* Category Management */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-bold mb-4">Categories</h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Category name"
                  className="flex-1 px-3 py-2 border rounded"
                />
                <button
                  onClick={createCategory}
                  disabled={catLoading || catName.trim().length < 2}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
                >
                  {catLoading ? "Loading..." : "Add"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <span key={cat._id} className="px-3 py-1 bg-gray-200 rounded-full text-sm">
                    {cat.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Product Creation */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-bold mb-4">Create Product</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Product name"
                  className="w-full px-3 py-2 border rounded"
                />
                <textarea
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({ ...productForm, description: e.target.value })
                  }
                  placeholder="Description"
                  rows={3}
                  className="w-full px-3 py-2 border rounded"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="Price (VND)"
                    className="px-3 py-2 border rounded"
                  />
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    placeholder="Stock"
                    className="px-3 py-2 border rounded"
                  />
                </div>
                <select
                  value={productForm.categoryId}
                  onChange={(e) =>
                    setProductForm({ ...productForm, categoryId: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                >
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                {/* Image Management */}
                <div>
                  <label className="block text-sm font-medium mb-2">Images</label>
                  <div className="flex gap-2 mb-4">
                    <input
                      id="prod-image-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() =>
                        document.getElementById("prod-image-input")?.click()
                      }
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Upload Image
                    </button>
                    <button
                      onClick={uploadProductImage}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Confirm Upload
                    </button>
                  </div>

                  {/* Image Grid */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {productForm.images.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={img.url}
                          alt={`Product ${idx}`}
                          className={`w-full h-24 object-cover rounded border-2 ${
                            img.isPrimary ? "border-blue-500" : "border-gray-300"
                          }`}
                        />
                        <div className="mt-2 flex gap-1 flex-wrap">
                          <button
                            onClick={() => setImagePrimary(idx)}
                            className={`text-xs px-2 py-1 rounded ${
                              img.isPrimary
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            Primary
                          </button>
                          <button
                            onClick={() => moveImage(idx, "up")}
                            disabled={idx === 0}
                            className="text-xs px-2 py-1 bg-gray-300 rounded disabled:opacity-50"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveImage(idx, "down")}
                            disabled={idx === productForm.images.length - 1}
                            className="text-xs px-2 py-1 bg-gray-300 rounded disabled:opacity-50"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => removeProductImage(idx)}
                            className="text-xs px-2 py-1 bg-red-500 text-white rounded"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={createProduct}
                  disabled={prodLoading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
                >
                  {prodLoading ? "Creating..." : "Create Product"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold mb-4">User Management</h2>
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  placeholder="Search by email/name"
                  className="px-3 py-2 border rounded"
                />
                <select
                  value={userRole}
                  onChange={(e) => {
                    setUserRole(e.target.value as any);
                    setUserPage(1);
                  }}
                  className="px-3 py-2 border rounded"
                >
                  <option value="">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-t">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium">Email</th>
                    <th className="text-left px-6 py-3 font-medium">Name</th>
                    <th className="text-left px-6 py-3 font-medium">Role</th>
                    <th className="text-left px-6 py-3 font-medium">Status</th>
                    <th className="text-left px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-3">{user.email}</td>
                      <td className="px-6 py-3">{user.name}</td>
                      <td className="px-6 py-3">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleChangeRole(user._id, e.target.value as any)
                          }
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            user.isBanned
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {user.isBanned ? "Banned" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-3 flex gap-2">
                        {user.isBanned ? (
                          <button
                            onClick={() => handleUnbanUser(user._id)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanUser(user._id)}
                            className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                          >
                            Ban
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {users.length} of {userTotal} users
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setUserPage(Math.max(1, userPage - 1))}
                  disabled={userPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setUserPage(userPage + 1)}
                  disabled={users.length < 20}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold">Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-t">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium">Order ID</th>
                    <th className="text-left px-6 py-3 font-medium">Total</th>
                    <th className="text-left px-6 py-3 font-medium">Payment</th>
                    <th className="text-left px-6 py-3 font-medium">Status</th>
                    <th className="text-left px-6 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-3 font-mono text-sm">
                        {order._id.slice(-8)}
                      </td>
                      <td className="px-6 py-3">${order.total.toLocaleString()}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            order.paymentStatus === "paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {order.paymentMethod} - {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-3">{order.orderStatus}</td>
                      <td className="px-6 py-3 text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
