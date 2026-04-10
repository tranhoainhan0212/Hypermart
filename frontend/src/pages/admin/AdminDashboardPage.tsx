import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { api } from "../../services/api";
import { useAppSelector } from "../../hooks/useApp";
import type { Product } from "../../redux/productsSlice";

type DashboardStats = { totalRevenue: number; totalOrders: number; totalUsers: number };
type CategoryItem   = { _id: string; name: string; slug: string };
type AdminOrder     = { _id: string; orderStatus: string; paymentMethod: string; total: number; createdAt: string; user?: any };
type Review         = { _id: string; rating: number; comment: string; createdAt: string; user: { _id: string; name: string; email: string } };
type TabKey         = "overview" | "categories" | "products" | "orders" | "reviews";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function resolveImageUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}
const TABS: { key: TabKey; label: string; color: string }[] = [
  { key: "overview",   label: "Tổng quan",  color: "#EE4D2D" },
  { key: "products",   label: "Sản phẩm",   color: "#2563eb" },
  { key: "categories", label: "Danh mục",   color: "#059669" },
  { key: "orders",     label: "Đơn hàng",   color: "#d97706" },
  { key: "reviews",    label: "Đánh giá",   color: "#7c3aed" },
];

const ORDER_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "Chờ xử lý",  color: "#92400e", bg: "#fef3c7" },
  confirmed: { label: "Xác nhận",   color: "#1e40af", bg: "#dbeafe" },
  shipping:  { label: "Đang giao",  color: "#5b21b6", bg: "#ede9fe" },
  completed: { label: "Hoàn thành", color: "#065f46", bg: "#d1fae5" },
  cancelled: { label: "Đã hủy",     color: "#991b1b", bg: "#fee2e2" },
};

export default function AdminDashboardPage() {
  const authUser = useAppSelector((s) => s.auth.user);
  const navigate  = useNavigate();

  const [tab, setTab]               = useState<TabKey>("overview");
  const [stats, setStats]           = useState<DashboardStats | null>(null);
  const [loading, setLoading]       = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [catName, setCatName]       = useState("");
  const [catLoading, setCatLoading] = useState(false);
  const [products, setProducts]     = useState<Product[]>([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [orders, setOrders]         = useState<AdminOrder[]>([]);
  const [reviews, setReviews]       = useState<Review[]>([]);

  const [pName, setPName]       = useState("");
  const [pDesc, setPDesc]       = useState("");
  const [pPrice, setPPrice]     = useState("0");
  const [pStock, setPStock]     = useState("0");
  const [pCatId, setPCatId]     = useState("");
  const [pImgUrl, setPImgUrl]   = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const isAdmin = authUser?.role === "admin";
  const activeTab = TABS.find(t => t.key === tab)!;

  useEffect(() => {
    if (!isAdmin) return;
    let alive = true;
    setLoading(true);
    Promise.all([
      api.get("/api/admin/dashboard"),
      api.get("/api/categories"),
      api.get("/api/products", { params: { page: 1, limit: 50, sort: "newest" } }),
      api.get("/api/orders",   { params: { page: 1, limit: 20 } }),
      api.get("/api/reviews",  { params: { page: 1, limit: 20 } }),
    ]).then(([statR, catR, prodR, ordR, revR]) => {
      if (!alive) return;
      setStats(statR.data);
      setCategories(catR.data.items  || []);
      setProducts  (prodR.data.items || []);
      setOrders    (ordR.data.items  || []);
      setReviews   (revR.data.items  || []);
      setPCatId((catR.data.items || [])[0]?._id || "");
    }).catch((e: any) => toast.error(e?.response?.data?.message || "Lỗi tải dữ liệu"))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [isAdmin]);

  async function createCategory() {
    if (catName.trim().length < 2 || catLoading) return;
    setCatLoading(true);
    try {
      const res = await api.post("/api/categories", { name: catName.trim() });
      toast.success("Tạo danh mục thành công");
      setCatName("");
      setCategories(p => [res.data.item, ...p]);
      if (!pCatId) setPCatId(res.data.item._id);
    } catch (e: any) { toast.error(e?.response?.data?.message || "Lỗi"); }
    finally { setCatLoading(false); }
  }

  async function deleteCategory(id: string) {
    if (!confirm("Xóa danh mục này?")) return;
    try {
      await api.delete(`/api/categories/${id}`);
      toast.success("Đã xóa danh mục");
      setCategories(p => p.filter(c => c._id !== id));
    } catch (e: any) { toast.error(e?.response?.data?.message || "Lỗi"); }
  }

  async function doUpload() {
    if (!uploadFile) { toast.error("Chưa chọn ảnh"); return; }
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("image", uploadFile);
      const res = await api.post("/api/upload/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setPImgUrl(res.data.url); toast.success("Upload thành công");
    } catch (e: any) { toast.error(e?.response?.data?.message || "Upload lỗi"); }
    finally { setUploading(false); }
  }

  async function saveProduct() {
    if (!pName.trim() || !pCatId || !pImgUrl) { toast.error("Điền đủ thông tin và upload ảnh"); return; }
    const price = Number(pPrice), stock = Number(pStock);
    if (!Number.isFinite(price) || price < 0) { toast.error("Giá không hợp lệ"); return; }
    if (!Number.isFinite(stock) || stock < 0) { toast.error("Tồn kho không hợp lệ"); return; }
    setProdLoading(true);
    try {
      const payload = { name: pName.trim(), description: pDesc.trim(), price, stock, categoryId: pCatId, images: [{ url: pImgUrl, alt: pName.trim() }] };
      if (editingId) { await api.put(`/api/products/${editingId}`, payload); toast.success("Đã cập nhật"); }
      else           { await api.post("/api/products", payload);             toast.success("Đã thêm sản phẩm"); }
      const r = await api.get("/api/products", { params: { page: 1, limit: 50, sort: "newest" } });
      setProducts(r.data.items || []);
      resetForm();
    } catch (e: any) { toast.error(e?.response?.data?.message || "Lỗi"); }
    finally { setProdLoading(false); }
  }

  async function deleteProduct(id: string) {
    if (!confirm("Xóa sản phẩm?")) return;
    try { await api.delete(`/api/products/${id}`); toast.success("Đã xóa"); setProducts(p => p.filter(x => x._id !== id)); }
    catch (e: any) { toast.error(e?.response?.data?.message || "Lỗi"); }
  }

  function resetForm() {
    setPName(""); setPDesc(""); setPPrice("0"); setPStock("0");
    setPCatId(categories[0]?._id || ""); setPImgUrl(""); setUploadFile(null); setEditingId(null);
  }

  function startEdit(p: Product) {
    setEditingId(p._id); setPName(p.name); setPDesc(p.description || "");
    setPPrice(String(p.price || 0)); setPStock(String(p.stock || 0));
    setPCatId(p.category?._id || pCatId); setPImgUrl((p.images && p.images[0]?.url) || "");
    setTab("products"); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function updateOrder(id: string, orderStatus: string) {
    try {
      await api.put(`/api/orders/${id}/status`, { orderStatus });
      setOrders(p => p.map(o => o._id === id ? { ...o, orderStatus } : o));
      toast.success("Đã cập nhật trạng thái");
    } catch (e: any) { toast.error(e?.response?.data?.message || "Lỗi"); }
  }

  async function deleteReview(id: string) {
    if (!confirm("Xóa đánh giá?")) return;
    try { await api.delete(`/api/reviews/${id}`); toast.success("Đã xóa"); setReviews(p => p.filter(r => r._id !== id)); }
    catch (e: any) { toast.error(e?.response?.data?.message || "Lỗi"); }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f0f2f5", fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      <style>{`
        .adm-input {
          width: 100%; box-sizing: border-box; height: 38px; border: 1px solid #d9d9d9;
          border-radius: 6px; padding: 0 12px; font-size: 13px; outline: none;
          font-family: inherit; color: #333; background: #fff; transition: border-color 0.15s;
        }
        .adm-input:focus { border-color: #EE4D2D; box-shadow: 0 0 0 2px rgba(238,77,45,0.08); }
        .adm-textarea {
          width: 100%; box-sizing: border-box; border: 1px solid #d9d9d9; border-radius: 6px;
          padding: 8px 12px; font-size: 13px; outline: none; font-family: inherit;
          color: #333; background: #fff; resize: vertical; transition: border-color 0.15s; line-height: 1.6;
        }
        .adm-textarea:focus { border-color: #EE4D2D; box-shadow: 0 0 0 2px rgba(238,77,45,0.08); }
        .adm-select {
          width: 100%; box-sizing: border-box; height: 38px; border: 1px solid #d9d9d9;
          border-radius: 6px; padding: 0 10px; font-size: 13px; outline: none;
          font-family: inherit; color: #333; background: #fff; cursor: pointer; transition: border-color 0.15s;
        }
        .adm-select:focus { border-color: #EE4D2D; }
        .adm-btn-primary {
          height: 38px; padding: 0 20px; background: #EE4D2D; color: #fff; border: none;
          border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;
          font-family: inherit; transition: background 0.15s; white-space: nowrap;
        }
        .adm-btn-primary:hover:not(:disabled) { background: #d73a1e; }
        .adm-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .adm-btn-ghost {
          height: 38px; padding: 0 16px; background: #fff; color: #555; border: 1px solid #d9d9d9;
          border-radius: 6px; font-size: 13px; cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .adm-btn-ghost:hover { border-color: #EE4D2D; color: #EE4D2D; }
        .adm-btn-danger {
          height: 28px; padding: 0 12px; background: #fff1f0; color: #cf1322;
          border: 1px solid #ffa39e; border-radius: 4px; font-size: 12px; cursor: pointer;
          font-family: inherit; transition: all 0.15s;
        }
        .adm-btn-danger:hover { background: #ffccc7; }
        .adm-btn-edit {
          height: 28px; padding: 0 12px; background: #fffbe6; color: #d48806;
          border: 1px solid #ffe58f; border-radius: 4px; font-size: 12px; cursor: pointer;
          font-family: inherit; transition: all 0.15s;
        }
        .adm-btn-edit:hover { background: #fff1b8; }
        .adm-card { background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .adm-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .adm-table th { background: #fafafa; padding: 11px 16px; text-align: left; font-weight: 600; color: #666; font-size: 12px; border-bottom: 1px solid #f0f0f0; }
        .adm-table td { padding: 12px 16px; border-bottom: 1px solid #f5f5f5; color: #333; vertical-align: middle; }
        .adm-table tr:last-child td { border-bottom: none; }
        .adm-table tr:hover td { background: #fafafa; }
        .adm-badge { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; }
        .adm-form-label { font-size: 12px; font-weight: 600; color: #555; margin-bottom: 5px; display: block; }
        .adm-upload-area {
          border: 1.5px dashed #d9d9d9; border-radius: 6px; padding: 14px 16px;
          background: #fafafa; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
        }
        .adm-status-select {
          height: 28px; padding: 0 8px; border: 1px solid #d9d9d9; border-radius: 4px;
          font-size: 12px; font-family: inherit; background: #fff; color: #333; cursor: pointer; outline: none;
        }
        .adm-status-select:focus { border-color: #EE4D2D; }
        .adm-section-header {
          padding: 14px 20px; border-bottom: 1px solid #f0f0f0;
          display: flex; align-items: center; justify-content: space-between;
        }
        .adm-section-title { font-size: 14px; font-weight: 700; color: #1a1a1a; }
        .adm-count-badge {
          font-size: 11px; background: #f5f5f5; color: #888; padding: 2px 10px;
          border-radius: 10px; font-weight: 500; border: 1px solid #e8e8e8;
        }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 224, background: "#1a1a2e", borderRight: "none",
        display: "flex", flexDirection: "column", flexShrink: 0,
        position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, background: "#EE4D2D", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 15, fontWeight: 800, flexShrink: 0 }}>
              H
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>HyperMart</div>
              <div style={{ fontSize: 11, color: "#EE4D2D", fontWeight: 500 }}>Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Admin info */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EE4D2D", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
              {(authUser?.email || "A")[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.9)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{authUser?.email}</div>
              <div style={{ fontSize: 11, color: "#4ade80", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                Quản trị viên
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "10px 10px", flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "rgb(247, 238, 238)", padding: "6px 10px 8px", letterSpacing: "0.8px", textTransform: "uppercase" }}>Menu chính</div>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
                color: tab === t.key ? "#fff" : "rgba(255,255,255,0.5)",
                background: tab === t.key ? t.color : "transparent",
                border: "none", width: "100%", textAlign: "left",
                transition: "all 0.15s", fontFamily: "inherit", marginBottom: 2,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: tab === t.key ? "rgba(255,255,255,0.8)" : t.color, flexShrink: 0, transition: "all 0.15s" }} />
              {t.label}
              {t.key === "orders"  && orders.length  > 0 && <span style={{ marginLeft: "auto", background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 8, padding: "1px 7px" }}>{orders.length}</span>}
              {t.key === "reviews" && reviews.length > 0 && <span style={{ marginLeft: "auto", background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 8, padding: "1px 7px" }}>{reviews.length}</span>}
            </button>
          ))}
        </nav>

        <div style={{ padding: "10px 10px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "9px 12px",
              borderRadius: 6, cursor: "pointer", fontSize: 15, fontWeight: 400,
              color: "rgba(255, 1, 1, 0.98)", background: "transparent",
              border: "none", width: "100%", textAlign: "left", fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            ← Về trang chủ
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

        {/* Topbar */}
        <div style={{
          background: "#fff", borderBottom: "1px solid #e8e8e8", padding: "0 24px",
          height: 54, display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0, position: "sticky", top: 0, zIndex: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 4, height: 20, borderRadius: 2, background: activeTab.color }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>{activeTab.label}</span>
            <span style={{ fontSize: 12, color: "#bbb" }}>/ HyperMart Admin</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#4ade80", fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            Online
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {[1,2,3].map(i => <div key={i} style={{ height: 100, background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }} />)}
            </div>
          ) : (
            <>

              {/* ══ OVERVIEW ══ */}
              {tab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Stat cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                    {[
                      { label: "Tổng doanh thu", value: `${(stats?.totalRevenue||0).toLocaleString("vi-VN")}đ`, sub: "Tất cả thời gian", color: "#EE4D2D", lightBg: "#fff4f0", icon: "💰" },
                      { label: "Tổng đơn hàng",  value: stats?.totalOrders || 0, sub: `${orders.length} gần đây`, color: "#2563eb", lightBg: "#eff6ff", icon: "📦" },
                      { label: "Người dùng",      value: stats?.totalUsers  || 0, sub: "Đã đăng ký", color: "#059669", lightBg: "#f0fdf4", icon: "👥" },
                    ].map(s => (
                      <div key={s.label} className="adm-card" style={{ padding: "24px", borderLeft: `5px solid ${s.color}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, color: "#666", marginBottom: 12, fontWeight: 500 }}>{s.label}</div>
                            <div style={{ fontSize: 32, fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 10 }}>{s.value}</div>
                            <div style={{ fontSize: 12, color: "#999" }}>{s.sub}</div>
                          </div>
                          <div style={{ width: 56, height: 56, borderRadius: 12, background: s.lightBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
                            {s.icon}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick access */}
                  <div className="adm-card" style={{ padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid #e8e8e8" }}>Truy cập nhanh</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                      {TABS.filter(t => t.key !== "overview").map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                          style={{ padding: "16px 16px", background: "#fff", border: `1.5px solid #e8e8e8`, borderRadius: 8, cursor: "pointer", textAlign: "left", transition: "all 0.15s", fontFamily: "inherit", borderLeft: `4px solid ${t.color}` }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fafafa"; (e.currentTarget as HTMLElement).style.borderColor = "#d9d9d9"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "#e8e8e8"; }}
                        >
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{t.label}</div>
                          <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>Quản lý</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recent orders */}
                  <div className="adm-card">
                    <div className="adm-section-header">
                      <span className="adm-section-title">Đơn hàng gần đây</span>
                      <button onClick={() => setTab("orders")} style={{ fontSize: 12, color: "#EE4D2D", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>Xem tất cả →</button>
                    </div>
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th>Mã đơn</th>
                          <th>Tổng tiền</th>
                          <th>Trạng thái</th>
                          <th>Ngày tạo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map(o => {
                          const st = ORDER_STATUS[o.orderStatus] || ORDER_STATUS.pending;
                          return (
                            <tr key={o._id}>
                              <td style={{ fontFamily: "monospace", color: "#666", fontSize: 12 }}>#{o._id.slice(-8)}</td>
                              <td style={{ fontWeight: 700, color: "#EE4D2D" }}>{o.total.toLocaleString("vi-VN")}đ</td>
                              <td><span className="adm-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                              <td style={{ color: "#aaa", fontSize: 12 }}>{new Date(o.createdAt).toLocaleDateString("vi-VN")}</td>
                            </tr>
                          );
                        })}
                        {orders.length === 0 && (
                          <tr><td colSpan={4} style={{ textAlign: "center", color: "#bbb", padding: "28px 0" }}>Chưa có đơn hàng</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ══ PRODUCTS ══ */}
              {tab === "products" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="adm-card" style={{ padding: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, paddingBottom: 14, borderBottom: `2px solid #eff6ff` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 4, height: 18, borderRadius: 2, background: "#2563eb" }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>
                          {editingId ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
                        </span>
                        {editingId && <span className="adm-badge" style={{ background: "#fef3c7", color: "#d97706" }}>Đang sửa</span>}
                      </div>
                      {editingId && <button className="adm-btn-ghost" onClick={resetForm} style={{ height: 30, fontSize: 12, padding: "0 12px" }}>Hủy</button>}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div>
                        <label className="adm-form-label">Tên sản phẩm *</label>
                        <input className="adm-input" placeholder="Nhập tên sản phẩm" value={pName} onChange={e => setPName(e.target.value)} />
                      </div>
                      <div>
                        <label className="adm-form-label">Danh mục *</label>
                        <select className="adm-select" value={pCatId} onChange={e => setPCatId(e.target.value)}>
                          <option value="">— Chọn danh mục</option>
                          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="adm-form-label">Giá (VNĐ) *</label>
                        <input className="adm-input" placeholder="0" type="number" value={pPrice} onChange={e => setPPrice(e.target.value)} />
                      </div>
                      <div>
                        <label className="adm-form-label">Tồn kho</label>
                        <input className="adm-input" placeholder="0" type="number" value={pStock} onChange={e => setPStock(e.target.value)} />
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label className="adm-form-label">Mô tả</label>
                        <textarea className="adm-textarea" placeholder="Mô tả sản phẩm..." rows={3} value={pDesc} onChange={e => setPDesc(e.target.value)} />
                      </div>
                    </div>

                    <div style={{ marginTop: 14 }}>
                      <label className="adm-form-label">Hình ảnh *</label>
                      <div className="adm-upload-area">
                        <label style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", background: "#fff", border: "1px solid #d9d9d9", borderRadius: 6, cursor: "pointer", fontSize: 13, color: "#555" }}>
                          Chọn ảnh
                          <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => setUploadFile(e.target.files?.[0] || null)} />
                        </label>
                        {uploadFile && <span style={{ fontSize: 12, color: "#666", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploadFile.name}</span>}
                        <button className="adm-btn-primary" onClick={doUpload} disabled={uploading || !uploadFile} style={{ height: 34 }}>
                          {uploading ? "Đang upload..." : "Upload"}
                        </button>
                        {pImgUrl && (
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <img src={`${resolveImageUrl(pImgUrl)}`} alt="preview" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, border: "1px solid #e0e0e0" }} />
                            <span style={{ fontSize: 12, color: "#059669", fontWeight: 500 }}>✓ Ảnh sẵn sàng</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <button className="adm-btn-primary" onClick={saveProduct} disabled={prodLoading} style={{ width: "100%" }}>
                        {prodLoading ? "Đang lưu..." : (editingId ? "Cập nhật sản phẩm" : "Thêm sản phẩm")}
                      </button>
                    </div>
                  </div>

                  <div className="adm-card">
                    <div className="adm-section-header">
                      <span className="adm-section-title">Danh sách sản phẩm</span>
                      <span className="adm-count-badge">{products.length} sản phẩm</span>
                    </div>
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th style={{ width: 60 }}>Ảnh</th>
                          <th>Tên sản phẩm</th>
                          <th>Danh mục</th>
                          <th>Giá</th>
                          <th>Tồn kho</th>
                          <th style={{ width: 120 }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(p => (
                          <tr key={p._id}>
                            <td>
                              <div style={{ width: 42, height: 42, borderRadius: 6, overflow: "hidden", border: "1px solid #f0f0f0", background: "#f9f9f9" }}>
                                {p.images?.[0]?.url && <img src={`${resolveImageUrl(p.images[0].url)}`} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                              </div>
                            </td>
                            <td style={{ fontWeight: 500 }}>
                              <div style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                            </td>
                            <td>
                              <span style={{ fontSize: 11, background: "#eff6ff", color: "#2563eb", padding: "2px 8px", borderRadius: 4, fontWeight: 500 }}>
                                {p.category?.name || "—"}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700, color: "#EE4D2D" }}>{p.price.toLocaleString("vi-VN")}đ</td>
                            <td>
                              <span style={{
                                fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                                background: p.stock === 0 ? "#fff1f0" : p.stock <= 5 ? "#fffbe6" : "#f6ffed",
                                color: p.stock === 0 ? "#cf1322" : p.stock <= 5 ? "#d48806" : "#389e0d",
                              }}>
                                {p.stock === 0 ? "Hết hàng" : p.stock}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button className="adm-btn-edit" onClick={() => startEdit(p)}>Sửa</button>
                                <button className="adm-btn-danger" onClick={() => deleteProduct(p._id)}>Xóa</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {products.length === 0 && (
                          <tr><td colSpan={6} style={{ textAlign: "center", color: "#bbb", padding: "32px 0" }}>Chưa có sản phẩm nào</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ══ CATEGORIES ══ */}
              {tab === "categories" && (
                <div className="adm-card">
                  <div className="adm-section-header" style={{ borderBottom: `2px solid #f0fdf4` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 4, height: 18, borderRadius: 2, background: "#059669" }} />
                      <span className="adm-section-title">Quản lý danh mục</span>
                    </div>
                    <span className="adm-count-badge">{categories.length} danh mục</span>
                  </div>
                  <div style={{ padding: "16px 20px 0" }}>
                    <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                      <input className="adm-input" placeholder="Nhập tên danh mục mới..." value={catName}
                        onChange={e => setCatName(e.target.value)} onKeyDown={e => e.key === "Enter" && createCategory()}
                        style={{ maxWidth: 300 }} />
                      <button className="adm-btn-primary" onClick={createCategory} disabled={catName.trim().length < 2 || catLoading}
                        style={{ background: "#059669" }} >
                        {catLoading ? "Đang tạo..." : "+ Thêm"}
                      </button>
                    </div>
                  </div>
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th style={{ width: 50 }}>#</th>
                        <th>Tên danh mục</th>
                        <th>Slug</th>
                        <th style={{ width: 90 }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((c, i) => (
                        <tr key={c._id}>
                          <td style={{ color: "#bbb" }}>{i + 1}</td>
                          <td>
                            <span style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669", display: "inline-block" }} />
                              {c.name}
                            </span>
                          </td>
                          <td style={{ fontFamily: "monospace", fontSize: 12, color: "#aaa" }}>{c.slug}</td>
                          <td><button className="adm-btn-danger" onClick={() => deleteCategory(c._id)}>Xóa</button></td>
                        </tr>
                      ))}
                      {categories.length === 0 && (
                        <tr><td colSpan={4} style={{ textAlign: "center", color: "#bbb", padding: "32px 0" }}>Chưa có danh mục</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ══ ORDERS ══ */}
              {tab === "orders" && (
                <div className="adm-card">
                  <div className="adm-section-header" style={{ borderBottom: `2px solid #fffbe6` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 4, height: 18, borderRadius: 2, background: "#d97706" }} />
                      <span className="adm-section-title">Quản lý đơn hàng</span>
                    </div>
                    <span className="adm-count-badge">{orders.length} đơn hàng</span>
                  </div>
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Tổng tiền</th>
                        <th>Thanh toán</th>
                        <th>Ngày tạo</th>
                        <th>Trạng thái</th>
                        <th style={{ width: 155 }}>Cập nhật</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => {
                        const st = ORDER_STATUS[o.orderStatus] || ORDER_STATUS.pending;
                        return (
                          <tr key={o._id}>
                            <td style={{ fontFamily: "monospace", color: "#666", fontSize: 12 }}>#{o._id.slice(-8)}</td>
                            <td style={{ fontWeight: 700, color: "#EE4D2D" }}>{o.total.toLocaleString("vi-VN")}đ</td>
                            <td style={{ fontSize: 12, color: "#888" }}>{o.paymentMethod}</td>
                            <td style={{ fontSize: 12, color: "#aaa" }}>{new Date(o.createdAt).toLocaleDateString("vi-VN")}</td>
                            <td><span className="adm-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                            <td>
                              <select className="adm-status-select" value={o.orderStatus} onChange={e => updateOrder(o._id, e.target.value)}>
                                {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                      {orders.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: "center", color: "#bbb", padding: "40px 0" }}>Chưa có đơn hàng nào</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ══ REVIEWS ══ */}
              {tab === "reviews" && (
                <div className="adm-card">
                  <div className="adm-section-header" style={{ borderBottom: `2px solid #f5f3ff` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 4, height: 18, borderRadius: 2, background: "#7c3aed" }} />
                      <span className="adm-section-title">Quản lý đánh giá</span>
                    </div>
                    <span className="adm-count-badge">{reviews.length} đánh giá</span>
                  </div>
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Người dùng</th>
                        <th>Đánh giá</th>
                        <th>Nội dung</th>
                        <th>Thời gian</th>
                        <th style={{ width: 80 }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.map(r => (
                        <tr key={r._id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                                {(r.user?.name || r.user?.email || "?")[0].toUpperCase()}
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 500, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {r.user?.name || r.user?.email}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                              {Array.from({ length: 5 }).map((_, i) => (
                                <svg key={i} width="11" height="11" viewBox="0 0 14 14">
                                  <path d="M7 1l1.545 3.13 3.455.502-2.5 2.437.59 3.44L7 8.885l-3.09 1.624.59-3.44L2 4.632l3.455-.502L7 1z"
                                    fill={i < r.rating ? "#EE4D2D" : "#e5e7eb"} />
                                </svg>
                              ))}
                              <span style={{ fontSize: 11, color: "#aaa", marginLeft: 4 }}>{r.rating}/5</span>
                            </div>
                          </td>
                          <td style={{ maxWidth: 260 }}>
                            <div style={{ fontSize: 12, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {r.comment || <span style={{ color: "#ccc", fontStyle: "italic" }}>Không có nội dung</span>}
                            </div>
                          </td>
                          <td style={{ fontSize: 12, color: "#aaa", whiteSpace: "nowrap" }}>{new Date(r.createdAt).toLocaleDateString("vi-VN")}</td>
                          <td><button className="adm-btn-danger" onClick={() => deleteReview(r._id)}>Xóa</button></td>
                        </tr>
                      ))}
                      {reviews.length === 0 && (
                        <tr><td colSpan={5} style={{ textAlign: "center", color: "#bbb", padding: "40px 0" }}>Chưa có đánh giá nào</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

            </>
          )}
        </div>
      </main>
    </div>
  );
}
