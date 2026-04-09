import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";


import { api } from "../services/api";
import { useAppDispatch, useAppSelector } from "../hooks/useApp";
import { cartActions, setCartItems, type CartItem } from "../redux/cartSlice";
import type { Product } from "../redux/productsSlice";

function imageUrl(url: string) {
  if (!url) return "/";
  if (url.startsWith("http")) return url;
  return `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}${url}`;
}

export default function CartPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const authUser = useAppSelector((s) => s.auth.user);
  const cartItems = useAppSelector((s) => s.cart.items);
  const [productsById, setProductsById] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(false);

  const expandedCart = useMemo(() => {
    return cartItems
      .map((ci) => {
        const p = productsById[ci.productId];
        if (!p) return null;
        return { ...ci, product: p };
      })
      .filter(Boolean) as Array<CartItem & { product: Product }>;
  }, [cartItems, productsById]);

  const subtotal = useMemo(() => {
    return expandedCart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  }, [expandedCart]);

  useEffect(() => {
    let alive = true;
    async function loadProducts() {
      if (cartItems.length === 0) {
        setProductsById({});
        return;
      }
      setLoading(true);
      try {
        const results = await Promise.allSettled(
          cartItems.map(async (ci) => {
            const res = await api.get(`/api/products/${encodeURIComponent(ci.productId)}`);
            return [ci.productId, (res.data as any).item as Product] as const;
          })
        );
        const validResults = results
          .filter((r) => r.status === "fulfilled")
          .map((r) => (r as PromiseFulfilledResult<any>).value);
          const validIds = new Set(validResults.map(([pid]) => pid));
        const cleanedItems = cartItems.filter((ci) => validIds.has(ci.productId));
        if (cleanedItems.length !== cartItems.length) {
          dispatch(cartActions.setItems(cleanedItems));
          dispatch(setCartItems(cleanedItems));
        }
        if (!alive) return;
       const map: Record<string, Product> = {};
          for (const [pid, p] of validResults) map[pid] = p;
          setProductsById(map);
      } catch {
        toast.error("Không thể tải sản phẩm trong giỏ");
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadProducts();
    return () => {
      alive = false;
    };
  }, [cartItems]);

  function updateQty(productId: string, quantity: number) {
    const nextItems = quantity <= 0 ? cartItems.filter((i) => i.productId !== productId) : cartItems.map((i) => (i.productId === productId ? { ...i, quantity } : i));
    dispatch(cartActions.setItems(nextItems));
    dispatch(setCartItems(nextItems));
  }

  const shippingFee = 0;
  const total = subtotal + shippingFee;

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh", padding: "16px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .cart-card { background: #fff; border-radius: 8px; border: 1px solid #f0f0f0; transition: all 0.2s; }
        .cart-card:hover { box-shadow: 0 4px 12px rgba(238, 77, 45, 0.08); }
        .cart-product-img { width: 100%; height: 100%; object-fit: cover; border-radius: 4px; }
        .qty-btn { border: 1px solid #e0e0e0; border-radius: 4px; background: #fff; padding: 4px 8px; cursor: pointer; font-size: 13px; transition: all 0.15s; color: #333; }
        .qty-btn:hover:not(:disabled) { border-color: #EE4D2D; color: #EE4D2D; background: #fff4f0; }
        .qty-btn:disabled { color: #ccc; cursor: not-allowed; }
        .remove-btn { border: none; background: none; color: #EE4D2D; cursor: pointer; font-size: 12px; padding: 0; transition: opacity 0.15s; }
        .remove-btn:hover { opacity: 0.7; }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#222", marginBottom: 4 }}>🛒 Giỏ hàng của bạn</h1>
          <p style={{ fontSize: 13, color: "#999" }}>
            {authUser ? `Đang đăng nhập: ${authUser.email} • ` : "Giỏ hàng lưu local • "}
            {cartItems.length} sản phẩm
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 8, padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🛍️</div>
            <div style={{ fontSize: 16, color: "#666", marginBottom: 8 }}>Giỏ hàng trống</div>
            <div style={{ fontSize: 13, color: "#999", marginBottom: 20 }}>Hãy chọn sản phẩm yêu thích để thêm vào giỏ</div>
            <button onClick={() => navigate("/products")} style={{ background: "#EE4D2D", color: "#fff", border: "none", padding: "10px 32px", borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background 0.15s" }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#d73a1e"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#EE4D2D"}>
              Tiếp tục mua sắm
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
            {/* Products List */}
            <div>
              {loading ? (
                <div style={{ background: "#fff", borderRadius: 8, padding: 20, textAlign: "center", color: "#999" }}>Đang tải...</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {expandedCart.map((it) => (
                    <div key={it.productId} className="cart-card" style={{ padding: 16 }}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ width: 100, height: 100, flexShrink: 0, border: "1px solid #f0f0f0", borderRadius: 4, overflow: "hidden", background: "#fafafa" }}>
                          <img
                            src={it.product.images?.[0]?.url ? imageUrl(it.product.images[0].url) : "/"}
                            alt={it.product.name}
                            className="cart-product-img"
                          />
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#222", marginBottom: 4, lineHeight: 1.4, maxHeight: 28, overflow: "hidden", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", display: "-webkit-box" } as any}>
                              {it.product.name}
                            </div>
                            <div style={{ fontSize: 11, color: "#bbb", marginBottom: 8 }}>
                              {it.product.category?.name}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#EE4D2D" }}>
                              {it.product.price.toLocaleString("vi-VN")}đ
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button className="qty-btn" disabled={it.quantity <= 1} onClick={() => updateQty(it.productId, it.quantity - 1)}>−</button>
                            <div style={{ minWidth: 40, textAlign: "center", fontSize: 13, fontWeight: 600, color: "#333" }}>{it.quantity}</div>
                            <button className="qty-btn" disabled={it.quantity >= it.product.stock} onClick={() => updateQty(it.productId, it.quantity + 1)}>+</button>
                            <div style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: "#222" }}>
                              {(it.product.price * it.quantity).toLocaleString("vi-VN")}đ
                            </div>
                            <button className="remove-btn" onClick={() => updateQty(it.productId, 0)}>Xóa</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="cart-card" style={{ padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#222", marginBottom: 12 }}>Tóm tắt đơn hàng</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#666", marginBottom: 8 }}>
                  <span>Tạm tính ({expandedCart.length} sp)</span>
                  <span style={{ fontWeight: 600, color: "#333" }}>{subtotal.toLocaleString("vi-VN")}đ</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#666", marginBottom: 12 }}>
                  <span>Phí vận chuyển</span>
                  <span style={{ fontWeight: 600, color: "#333" }}>Miễn phí</span>
                </div>
                <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700 }}>
                  <span style={{ color: "#222" }}>Tổng cộng</span>
                  <span style={{ color: "#EE4D2D" }}>{total.toLocaleString("vi-VN")}đ</span>
                </div>
              </div>

              <button onClick={() => navigate("/checkout")} style={{ width: "100%", background: "#EE4D2D", color: "#fff", border: "none", padding: 14, borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#d73a1e"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#EE4D2D"}>
                Tiến hành thanh toán
              </button>
              
              <button onClick={() => navigate("/products")} style={{ width: "100%", background: "transparent", color: "#EE4D2D", border: "1px solid #EE4D2D", padding: 12, borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fff4f0"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                ← Tiếp tục mua sắm
              </button>

              <div className="cart-card" style={{ padding: 12, background: "#fff4f0", border: "1px solid #ffe4d5" }}>
                <div style={{ fontSize: 11, color: "#EE4D2D", fontWeight: 600, marginBottom: 6 }}>💡 Mẹo tiết kiệm</div>
                <div style={{ fontSize: 11, color: "#999", lineHeight: 1.6 }}>
                  Mua thêm nhiều sản phẩm để tiết kiệm chi phí. Áp dụng các mã giảm giá nếu có!
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

