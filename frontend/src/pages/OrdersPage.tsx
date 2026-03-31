import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { api } from "../services/api";

type Order = {
  _id: string;
  orderStatus: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/api/orders/me", { params: { page, limit: 10 } });
        const data = res.data as any;
        if (!alive) return;
        setOrders((data.items || []) as Order[]);
        setTotalPages(data.totalPages || 1);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Không tải được đơn hàng");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [page]);

  const getStatusBadge = (status: string) => {
    const normalizedStatus = (status || "").toLowerCase().trim();
    const badges: Record<string, { bg: string; color: string; icon: string; label: string }> = {
      pending: { bg: "#fff3cd", color: "#856404", icon: "⏳", label: "Chờ xử lý" },
      chờ: { bg: "#fff3cd", color: "#856404", icon: "⏳", label: "Chờ xử lý" },
      confirmed: { bg: "#cfe2ff", color: "#084298", icon: "📋", label: "Đã xác nhận" },
      xác: { bg: "#cfe2ff", color: "#084298", icon: "📋", label: "Đã xác nhận" },
      shipped: { bg: "#e7d4f5", color: "#6f42c1", icon: "📦", label: "Đang vận chuyển" },
      vận: { bg: "#e7d4f5", color: "#6f42c1", icon: "📦", label: "Đang vận chuyển" },
      delivered: { bg: "#d1e7dd", color: "#0f5132", icon: "✅", label: "Đã giao" },
      completed: { bg: "#d1e7dd", color: "#0f5132", icon: "✅", label: "Hoàn thành" },
      giao: { bg: "#d1e7dd", color: "#0f5132", icon: "✅", label: "Đã giao" },
      hoàn: { bg: "#d1e7dd", color: "#0f5132", icon: "✅", label: "Hoàn thành" },
      cancelled: { bg: "#f8d7da", color: "#842029", icon: "❌", label: "Đã hủy" },
      hủy: { bg: "#f8d7da", color: "#842029", icon: "❌", label: "Đã hủy" },
    };
    return badges[normalizedStatus] || { bg: "#e2e3e5", color: "#383d41", icon: "ℹ️", label: status || "Không xác định" };
  };

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh", padding: "16px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .order-card { background: #fff; border-radius: 8px; border: 1px solid #f0f0f0; transition: all 0.2s; padding: 16px; }
        .order-card:hover { box-shadow: 0 4px 12px rgba(238, 77, 45, 0.08); }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .payment-badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; background: rgba(238, 77, 45, 0.1); color: #EE4D2D; }
        .page-btn { border: 1px solid #e0e0e0; border-radius: 4px; background: #fff; padding: 8px 16px; cursor: pointer; font-size: 13px; transition: all 0.15s; color: #333; font-weight: 500; }
        .page-btn:hover:not(:disabled) { border-color: #EE4D2D; color: #EE4D2D; background: #fff4f0; }
        .page-btn:disabled { color: #ccc; cursor: not-allowed; }
      `}</style>

      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#222", marginBottom: 4 }}>📦 Đơn hàng của tôi</h1>
          <p style={{ fontSize: 13, color: "#999" }}>Quản lý và theo dõi tất cả đơn hàng của bạn</p>
        </div>

        {loading ? (
          <div style={{ background: "#fff", borderRadius: 8, padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 16, color: "#999", animation: "pulse 1.5s infinite" }}>⏳ Đang tải...</div>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 8, padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 16, color: "#666", marginBottom: 8 }}>Chưa có đơn hàng</div>
            <div style={{ fontSize: 13, color: "#999" }}>Bạn chưa thực hiện bất kỳ đơn hàng nào. Hãy bắt đầu mua sắm ngay!</div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {orders.map((o) => {
                const badge = getStatusBadge(o.orderStatus);
                const orderDate = new Date(o.createdAt);
                return (
                  <div key={o._id} className="order-card">
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                            {badge.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#222" }}>Đơn hàng #{o._id.slice(-8).toUpperCase()}</div>
                            <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                              {orderDate.toLocaleDateString("vi-VN")} • {orderDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <div className="status-badge" style={{ background: badge.bg, color: badge.color }}>
                            {badge.label}
                          </div>
                          <div className="payment-badge">{o.paymentMethod}</div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right", minWidth: 150 }}>
                        <div style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>Tổng tiền</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#EE4D2D" }}>
                          {o.total.toLocaleString("vi-VN")}đ
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <button
                  className="page-btn"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  type="button"
                >
                  ← Trang trước
                </button>
                <div style={{ padding: "8px 16px", fontSize: 13, color: "#666", fontWeight: 600 }}>
                  Trang <span style={{ color: "#EE4D2D" }}>{page}</span> / {totalPages}
                </div>
                <button
                  className="page-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  type="button"
                >
                  Trang sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

