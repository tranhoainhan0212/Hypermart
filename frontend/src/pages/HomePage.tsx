import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import { api } from "../services/api";
import type { Product } from "../redux/productsSlice";
import { useAppDispatch, useAppSelector } from "../hooks/useApp";
import { cartActions, setCartItems } from "../redux/cartSlice";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function imgUrl(p: any) {
  const url = p?.images?.[0]?.url || "";
  if (!url) return "/";
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}

const SLIDES = [
  "/banners/banner1.jpg",
  "/banners/banner2.jpg",
  "/banners/banner3.jpg",
];

const SIDE_BANNERS = [
  { src: "/Images/partner1.png", label: "Ưu đãi đặc biệt", sub: "Giảm đến 50%", bg: "#ff6b35" },
  { src: "/Images/partner2.png", label: "Hàng mới về", sub: "Xem ngay →", bg: "#1a9e8f" },
];

type CategoryItem = { _id: string; name: string; slug: string };

const CAT_ICONS: Record<string, string> = {
  "điện tử": "📱", "thời trang": "👗", "gia dụng": "🏡",
  "sách": "📚", "thể thao": "⚽", "mỹ phẩm": "💄",
  "đồ chơi": "🧸", "thực phẩm": "🍜",
};

function getCatIcon(name: string) {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(CAT_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "🏷️";
}

const IconFlash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export default function HomePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((s) => s.cart.items);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [slide, setSlide] = useState(0);
  const [timeLeft, setTimeLeft] = useState(7200);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [sideErr, setSideErr] = useState([false, false]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [activeCatId, setActiveCatId] = useState<string | null>(null);

  useEffect(() => {
    api.get("/api/categories").then((res) => setCategories(res.data.items || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (n: number) => String(n).padStart(2, "0");
  const hours = fmt(Math.floor(timeLeft / 3600));
  const minutes = fmt(Math.floor((timeLeft % 3600) / 60));
  const seconds = fmt(timeLeft % 60);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get("/api/products", { params: { page: 1, limit: 20 } })
      .then((res) => { if (alive) setProducts(res.data.items || []); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    let d = [...products];
    if (search) d = d.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (activeCatId) d = d.filter((p: any) => p.category?._id === activeCatId || p.categoryId === activeCatId);
    if (sort === "price") d.sort((a, b) => a.price - b.price);
    return d;
  }, [products, search, sort, activeCatId]);

  const toggleWish = (id: string) =>
    setWishlist((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  function addToCart(p: Product, e: React.MouseEvent) {
    e.stopPropagation();
    const existing = cartItems.find((i) => i.productId === p._id);
    const currentQty = existing?.quantity || 0;
    if (p.stock <= currentQty) {
      toast.error("Không đủ tồn kho");
      return;
    }
    const nextItems = existing
      ? cartItems.map((i) => i.productId === p._id ? { ...i, quantity: currentQty + 1 } : i)
      : [...cartItems, { productId: p._id, quantity: 1 }];
    dispatch(cartActions.setItems(nextItems));
    dispatch(setCartItems(nextItems));
    toast.success("Đã thêm vào giỏ hàng");
  }

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .hp-card { background: #fff; border-radius: 4px; }
        .hp-cat-chip {
          display: flex; align-items: center; gap: 5px; padding: 6px 14px; border-radius: 20px;
          border: 1.5px solid #e0e0e0; background: #fff; cursor: pointer; font-size: 12.5px;
          font-weight: 500; color: #555; white-space: nowrap; transition: all 0.15s; font-family: inherit;
        }
        .hp-cat-chip:hover:not(.active) { border-color: #EE4D2D; color: #EE4D2D; background: #fff4f0; }
        .hp-cat-chip.active { border-color: #EE4D2D; background: #EE4D2D; color: #fff; }
        .hp-product-card {
          overflow: hidden; background: #fff; cursor: pointer; display: flex; flex-direction: column;
          transition: box-shadow 0.2s, transform 0.18s;
          border: none; border-right: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0; border-radius: 0;
        }
        .hp-product-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.10); transform: translateY(-3px); z-index: 1; position: relative; }
        .hp-product-img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; transition: transform 0.3s; }
        .hp-product-card:hover .hp-product-img { transform: scale(1.04); }
        .hp-add-btn {
          width: 100%; padding: 7px 0; background: #EE4D2D; color: #fff; border: none;
          font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background 0.15s;
        }
        .hp-add-btn:hover:not(:disabled) { background: #d73a1e; }
        .hp-add-btn:disabled { background: #ccc; cursor: not-allowed; }
        .hp-wish-btn {
          position: absolute; top: 6px; right: 6px; background: rgba(255,255,255,0.92);
          border: none; border-radius: 50%; width: 26px; height: 26px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 13px; box-shadow: 0 1px 4px rgba(0,0,0,0.12);
          opacity: 0; transition: opacity 0.15s;
        }
        .hp-product-card:hover .hp-wish-btn { opacity: 1; }
        .hp-slide-btn {
          position: absolute; top: 50%; transform: translateY(-50%);
          background: rgba(255,255,255,0.82); border: none; border-radius: 50%;
          width: 30px; height: 30px; cursor: pointer; font-size: 18px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s; box-shadow: 0 1px 6px rgba(0,0,0,0.15);
        }
        .hp-slide-btn:hover { background: #fff; }
        .shimmer {
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 800px 100%; animation: shimmer 1.4s infinite;
        }
        .hp-sort-select {
          border: 1px solid #e0e0e0; border-radius: 4px; padding: 0 10px; height: 32px;
          font-size: 12px; font-family: inherit; background: #fff; color: #555; cursor: pointer; outline: none;
        }
        .hp-sort-select:focus { border-color: #EE4D2D; }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>

        {/* ── BANNER ── */}
        <section style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
          <div style={{ position: "relative", borderRadius: 4, overflow: "hidden", aspectRatio: "16/6", background: "linear-gradient(135deg, #EE4D2D 0%, #ff8860 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
            <img src={SLIDES[slide]} alt="banner" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", fontSize: 18, fontWeight: 700, pointerEvents: "none" }}></div>
            <button className="hp-slide-btn" onClick={() => setSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length)} style={{ left: 8 }}>‹</button>
            <button className="hp-slide-btn" onClick={() => setSlide((s) => (s + 1) % SLIDES.length)} style={{ right: 8 }}>›</button>
            <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)} style={{
                  height: 4, borderRadius: 2, border: "none", cursor: "pointer", padding: 0,
                  width: i === slide ? 22 : 5,
                  background: i === slide ? "white" : "rgba(255,255,255,0.5)", transition: "all 0.3s",
                }} />
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {SIDE_BANNERS.map((banner, i) => (
              <div key={i} style={{ flex: 1, borderRadius: 4, overflow: "hidden", minHeight: 80, position: "relative", background: banner.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={banner.src} alt={banner.label}
                  onError={() => setSideErr(p => { const n = [...p]; n[i] = true; return n; })}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: sideErr[i] ? "none" : "block" }} />
              </div>
            ))}
          </div>
        </section>

        {/* ── CATEGORY CHIPS ── */}
        <div className="hp-card" style={{ padding: "12px 16px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button className={`hp-cat-chip${activeCatId === null ? " active" : ""}`} onClick={() => setActiveCatId(null)} type="button">
              🏠 Tất cả
            </button>
            {categories.map((c) => (
              <button key={c._id} className={`hp-cat-chip${activeCatId === c._id ? " active" : ""}`} onClick={() => setActiveCatId(c._id)} type="button">
                {getCatIcon(c.name)} {c.name}
              </button>
            ))}
            <Link to="/products" style={{ marginLeft: "auto", fontSize: 12, color: "#EE4D2D", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
              Tất cả danh mục →
            </Link>
          </div>
          {activeCatId && (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#888" }}>
                Đang lọc: <strong style={{ color: "#EE4D2D" }}>{categories.find(c => c._id === activeCatId)?.name}</strong>
                {" "}— <span style={{ color: "#333" }}>{filtered.length} sản phẩm</span>
              </span>
              <button onClick={() => setActiveCatId(null)} style={{ fontSize: 11, color: "#888", border: "1px solid #e0e0e0", background: "none", borderRadius: 2, padding: "1px 8px", cursor: "pointer" }} type="button">
                Xóa lọc
              </button>
              <Link to={`/products?category=${activeCatId}`} style={{ fontSize: 11, color: "#EE4D2D", textDecoration: "none", fontWeight: 600 }}>
                Xem tất cả trong danh mục →
              </Link>
            </div>
          )}
        </div>

        {/* ── FLASH SALE ── */}
        <div style={{ background: "#EE4D2D", borderRadius: 4, padding: "10px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "white" }}>
            <IconFlash />
            <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: "0.5px" }}>FLASH SALE</span>
          </div>
          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.3)" }} />
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {[hours, minutes, seconds].map((t, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ background: "white", color: "#EE4D2D", padding: "2px 8px", borderRadius: 3, fontWeight: 800, fontSize: 13, minWidth: 28, textAlign: "center", display: "inline-block" }}>{t}</span>
                {i < 2 && <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: 15 }}>:</span>}
              </span>
            ))}
          </div>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Kết thúc sau</span>
          <Link to="/products" style={{ marginLeft: "auto", color: "rgba(255,255,255,0.85)", fontSize: 12, textDecoration: "none", fontWeight: 500 }}>Xem tất cả →</Link>
        </div>

        {/* ── PRODUCTS ── */}
        <div className="hp-card" style={{ padding: "14px 14px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>
                {activeCatId ? categories.find(c => c._id === activeCatId)?.name || "Danh mục" : "🔥 Sản phẩm nổi bật"}
              </span>
              {filtered.length > 0 && !loading && <span style={{ fontSize: 12, color: "#aaa" }}>({filtered.length})</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #e0e0e0", borderRadius: 4, padding: "0 10px", height: 32 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input placeholder="Tìm sản phẩm..." value={search} onChange={(e) => setSearch(e.target.value)}
                  style={{ border: "none", outline: "none", fontSize: 12, fontFamily: "inherit", width: 130, color: "#333", background: "transparent" }} />
              </div>
              <select className="hp-sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">Mới nhất</option>
                <option value="price">Giá thấp nhất</option>
              </select>
              <Link to="/products" style={{ color: "#EE4D2D", textDecoration: "none", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>Xem tất cả →</Link>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, padding: 8, borderTop: "1px solid #f0f0f0" }}>
            {(loading ? Array.from({ length: 12 }) : filtered.slice(0, 12)).map((p: any, idx) => {
              if (!p) return (
                <div key={idx} style={{ padding: 10, borderRight: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0" }}>
                  <div className="shimmer" style={{ aspectRatio: "1", borderRadius: 2, marginBottom: 8 }} />
                  <div className="shimmer" style={{ height: 10, borderRadius: 2, marginBottom: 5 }} />
                  <div className="shimmer" style={{ height: 10, borderRadius: 2, width: "70%", marginBottom: 5 }} />
                  <div className="shimmer" style={{ height: 14, borderRadius: 2, width: "50%" }} />
                </div>
              );

              const inCartQty = cartItems.find((i) => i.productId === p._id)?.quantity || 0;
              const outOfStock = p.stock <= 0 || inCartQty >= p.stock;

              return (
                <div key={p._id} className="hp-product-card" onClick={() => navigate(`/products/${p._id}`)}>
                  <div style={{ position: "relative", overflow: "hidden", background: "#f9f9f9" }}>
                    <img loading="lazy" src={imgUrl(p)} alt={p.name} className="hp-product-img" />
                    <button className="hp-wish-btn" onClick={(e) => { e.stopPropagation(); toggleWish(p._id); }} type="button">
                      {wishlist.includes(p._id) ? "❤️" : "🤍"}
                    </button>
                    <div style={{ position: "absolute", top: 6, left: 6, background: "#EE4D2D", color: "white", fontSize: 9, fontWeight: 700, borderRadius: 2, padding: "1px 5px" }}>-20%</div>
                    {inCartQty > 0 && (
                      <div style={{ position: "absolute", bottom: 6, left: 6, background: "rgba(0,0,0,0.55)", color: "white", fontSize: 9, fontWeight: 700, borderRadius: 2, padding: "1px 5px" }}>Giỏ: {inCartQty}</div>
                    )}
                  </div>
                  <div style={{ padding: "8px 10px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                    {p.category?.name && <span style={{ fontSize: 10, color: "#bbb" }}>{p.category.name}</span>}
                    <div style={{ fontSize: 12, color: "#333", lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as any}>{p.name}</div>
                    <div style={{ color: "#EE4D2D", fontWeight: 700, fontSize: 14, marginTop: 2 }}>{p.price.toLocaleString("vi-VN")}đ</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#aaa" }}>
                      <span style={{ color: "#EE4D2D" }}>{p.ratingAverage?.toFixed(1)}</span>
                      <svg width="9" height="9" viewBox="0 0 14 14"><path d="M7 1l1.545 3.13 3.455.502-2.5 2.437.59 3.44L7 8.885l-3.09 1.624.59-3.44L2 4.632l3.455-.502L7 1z" fill="#EE4D2D" /></svg>
                      <span>({p.ratingCount})</span>
                      {p.stock <= 5 && p.stock > 0 && <><span style={{ color: "#ddd" }}>·</span><span style={{ color: "#EE4D2D" }}>Còn {p.stock}</span></>}
                    </div>
                  </div>
                  <button className="hp-add-btn" disabled={outOfStock} onClick={(e) => addToCart(p, e)} type="button">
                    {outOfStock ? (p.stock <= 0 ? "Hết hàng" : "Đã đủ") : "+ Thêm vào giỏ"}
                  </button>
                </div>
              );
            })}
          </div>

          {!loading && filtered.length === 0 && (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
              <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>Không có sản phẩm trong danh mục này</div>
              <button onClick={() => setActiveCatId(null)} style={{ fontSize: 13, color: "#EE4D2D", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                Xem tất cả sản phẩm
              </button>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div style={{ padding: "14px 0", textAlign: "center", borderTop: "1px solid #f5f5f5" }}>
              <Link to={activeCatId ? `/products?category=${activeCatId}` : "/products"}
                style={{ display: "inline-block", padding: "9px 40px", border: "1px solid #EE4D2D", color: "#EE4D2D", borderRadius: 2, fontSize: 13, fontWeight: 500, textDecoration: "none" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fff4f0"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                Xem thêm sản phẩm
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}