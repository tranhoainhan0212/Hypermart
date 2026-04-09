import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";


import { useAppDispatch, useAppSelector } from "../hooks/useApp";
import { fetchProducts, type Product } from "../redux/productsSlice";
import { cartActions, setCartItems } from "../redux/cartSlice";
import { api } from "../services/api";

type CategoryItem = { _id: string; name: string; slug: string };

function imageUrl(url: string) {
  if (!url) return "/";
  if (url.startsWith("http")) return url;
  return `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}${url}`;
}

function StarRating({ value }: { value: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 14 14">
          <path
            d="M7 1l1.545 3.13 3.455.502-2.5 2.437.59 3.44L7 8.885l-3.09 1.624.59-3.44L2 4.632l3.455-.502L7 1z"
            fill={i < Math.round(value) ? "#EE4D2D" : "#e5e7eb"}
            stroke={i < Math.round(value) ? "#EE4D2D" : "#d1d5db"}
            strokeWidth="0.5"
          />
        </svg>
      ))}
    </span>
  );
}

export default function ProductsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { list, loading, error, totalPages, limit } = useAppSelector((s) => s.products);
  const cartItems = useAppSelector((s) => s.cart.items);

  const [categories, setCategories] = useState<CategoryItem[]>([]);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minRating, setMinRating] = useState<string>("");
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc" | "rating_desc">("newest");
  const [curPage, setCurPage] = useState(1);

  const cartQtyByProductId = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of cartItems) m.set(i.productId, i.quantity);
    return m;
  }, [cartItems]);

  useEffect(() => {
    api
      .get("/api/categories")
      .then((res) => setCategories(res.data.items || []))
      .catch(() => toast.error("Failed to load categories"));
  }, []);

  useEffect(() => {
    dispatch(
      fetchProducts({
        q: q.trim() ? q.trim() : undefined,
        category: category || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        minRating: minRating ? Number(minRating) : undefined,
        page: curPage,
        limit,
        sort,
      })
    )
      .unwrap()
      .catch(() => {});
  }, [dispatch, q, category, minPrice, maxPrice, minRating, curPage, limit, sort]);

  function mergeCart(product: Product) {
    const existing = cartQtyByProductId.get(product._id) || 0;
    if (product.stock <= existing) {
      toast.error("Không đủ tồn kho");
      return;
    }
    const nextQty = existing + 1;
    const next = cartItems.some((i) => i.productId === product._id)
      ? cartItems.map((i) => (i.productId === product._id ? { ...i, quantity: nextQty } : i))
      : [...cartItems, { productId: product._id, quantity: 1 }];
    dispatch(cartActions.setItems(next));
    dispatch(setCartItems(next));
    toast.success("Đã thêm vào giỏ hàng");
  }

  const SORT_OPTIONS = [
    { value: "newest", label: "Mới nhất" },
    { value: "price_asc", label: "Giá tăng dần" },
    { value: "price_desc", label: "Giá giảm dần" },
    { value: "rating_desc", label: "Đánh giá cao" },
  ] as const;



  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh", padding: "12px 0" }}>
      <style>{`
        .pp-card { background: #fff; border-radius: 4px; }
        .pp-input {
          height: 36px; border: 1px solid #e0e0e0; border-radius: 4px;
          padding: 0 12px; font-size: 13px; outline: none; width: 100%; box-sizing: border-box;
          font-family: inherit; color: #333; background: #fff; transition: border-color 0.15s;
        }
        .pp-input:focus { border-color: #EE4D2D; }
        .pp-select {
          height: 36px; border: 1px solid #e0e0e0; border-radius: 4px;
          padding: 0 10px; font-size: 13px; outline: none; width: 100%; box-sizing: border-box;
          font-family: inherit; color: #333; background: #fff; cursor: pointer; transition: border-color 0.15s;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23999'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 28px;
        }
        .pp-select:focus { border-color: #EE4D2D; }
        .pp-search-btn {
          height: 36px; padding: 0 20px; background: #EE4D2D; color: #fff; border: none;
          border-radius: 4px; font-size: 13px; font-weight: 500; cursor: pointer;
          white-space: nowrap; transition: background 0.15s; display: flex; align-items: center; gap: 6px;
        }
        .pp-search-btn:hover { background: #d73a1e; }
        .pp-sort-btn {
          height: 32px; padding: 0 16px; border: 1px solid #e0e0e0; background: #fff;
          border-radius: 2px; font-size: 13px; cursor: pointer; white-space: nowrap;
          transition: border-color 0.15s, color 0.15s, background 0.15s; color: #555;
        }
        .pp-sort-btn.active { border-color: #EE4D2D; color: #EE4D2D; background: #fff4f0; }
        .pp-sort-btn:hover:not(.active) { border-color: #ccc; }
        .pp-product-card {
          background: #fff; border-radius: 4px; overflow: hidden; cursor: pointer;
          transition: box-shadow 0.2s, transform 0.15s;
          border: 1px solid #f0f0f0;
          display: flex; flex-direction: column;
        }
        .pp-product-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.10); transform: translateY(-2px); }
        .pp-product-img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; background: #f9f9f9; }
        .pp-product-body { padding: 10px 12px 12px; flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .pp-product-name { font-size: 13px; color: #333; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-weight: 400; margin: 0; }
        .pp-product-price { font-size: 15px; font-weight: 600; color: #EE4D2D; margin: 4px 0 0; }
        .pp-product-meta { font-size: 11px; color: #999; display: flex; align-items: center; gap: 4px; }
        .pp-add-btn {
          margin-top: auto; width: 100%; height: 34px; background: #fff; color: #EE4D2D;
          border: 1px solid #EE4D2D; border-radius: 0 0 4px 4px; font-size: 13px; font-weight: 500;
          cursor: pointer; transition: background 0.15s; display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .pp-add-btn:hover:not(:disabled) { background: #fff4f0; }
        .pp-add-btn:disabled { opacity: 0.35; cursor: not-allowed; border-color: #ddd; color: #aaa; }
        .pp-view-btn {
          position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,0.92);
          border: 1px solid #e0e0e0; border-radius: 2px; padding: 4px 10px; font-size: 11px;
          color: #555; cursor: pointer; opacity: 0; transition: opacity 0.15s;
        }
        .pp-product-card:hover .pp-view-btn { opacity: 1; }
        .pp-page-btn {
          min-width: 32px; height: 32px; border: 1px solid #e0e0e0; border-radius: 2px;
          background: #fff; font-size: 13px; cursor: pointer; display: flex;
          align-items: center; justify-content: center; padding: 0 6px; color: #555; transition: border-color 0.15s, color 0.15s;
        }
        .pp-page-btn:hover:not(:disabled):not(.active) { border-color: #EE4D2D; color: #EE4D2D; }
        .pp-page-btn.active { border-color: #EE4D2D; color: #EE4D2D; background: #fff; }
        .pp-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .pp-cat-chip {
          height: 30px; padding: 0 14px; border-radius: 15px; font-size: 12px;
          border: 1px solid #e0e0e0; background: #fff; cursor: pointer; white-space: nowrap;
          transition: all 0.15s; color: #555;
        }
        .pp-cat-chip.active { border-color: #EE4D2D; background: #fff4f0; color: #EE4D2D; font-weight: 500; }
        .pp-cat-chip:hover:not(.active) { border-color: #ccc; }
        .pp-in-cart-badge {
          position: absolute; top: 8px; left: 8px; background: #EE4D2D; color: #fff;
          font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 2px;
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>

        {/* ── Search & filter bar ── */}
        <div className="pp-card" style={{ padding: "16px 20px" }}>
          {/* Search row */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#bbb" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setCurPage(1)}
                placeholder="Tìm kiếm sản phẩm..."
                className="pp-input"
                style={{ paddingLeft: 32 }}
              />
            </div>
            <button className="pp-search-btn" onClick={() => setCurPage(1)} type="button">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Tìm kiếm
            </button>
          </div>

          {/* Category chips */}
          {categories.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              <button
                className={`pp-cat-chip${!category ? " active" : ""}`}
                onClick={() => { setCategory(undefined); setCurPage(1); }}
                type="button"
              >
                Tất cả
              </button>
              {categories.map((c) => (
                <button
                  key={c._id}
                  className={`pp-cat-chip${category === c._id ? " active" : ""}`}
                  onClick={() => { setCategory(c._id); setCurPage(1); }}
                  type="button"
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {/* Filter row */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
              <span style={{ fontSize: 13, color: "#777", whiteSpace: "nowrap" }}>Giá</span>
              <input
                className="pp-input"
                style={{ width: 110 }}
                placeholder="Từ (đ)"
                value={minPrice}
                type="number"
                onChange={(e) => { setMinPrice(e.target.value); setCurPage(1); }}
              />
              <span style={{ color: "#ccc", fontSize: 13 }}>—</span>
              <input
                className="pp-input"
                style={{ width: 110 }}
                placeholder="Đến (đ)"
                value={maxPrice}
                type="number"
                onChange={(e) => { setMaxPrice(e.target.value); setCurPage(1); }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: "#777", whiteSpace: "nowrap" }}>Đánh giá</span>
              <div style={{ width: 130 }}>
                <select
                  className="pp-select"
                  value={minRating}
                  onChange={(e) => { setMinRating(e.target.value); setCurPage(1); }}
                >
                  <option value="">Tất cả</option>
                  <option value="3">Từ 3 sao</option>
                  <option value="4">Từ 4 sao</option>
                  <option value="5">5 sao</option>
                </select>
              </div>
            </div>

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, color: "#777", whiteSpace: "nowrap" }}>Sắp xếp</span>
              {SORT_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  className={`pp-sort-btn${sort === o.value ? " active" : ""}`}
                  onClick={() => { setSort(o.value); setCurPage(1); }}
                  type="button"
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Results ── */}
        {loading ? (
          <div style={{ background: "#fff", borderRadius: 4, padding: "60px 20px", textAlign: "center", color: "#aaa", fontSize: 14 }}>
            Đang tải sản phẩm...
          </div>
        ) : error ? (
          <div style={{ background: "#fff", borderRadius: 4, padding: "40px 20px", textAlign: "center", color: "#EE4D2D", fontSize: 14 }}>
            {error}
          </div>
        ) : list.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 4, padding: "60px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 15, color: "#555", marginBottom: 6 }}>Không tìm thấy sản phẩm nào</div>
            <div style={{ fontSize: 13, color: "#aaa" }}>Thử thay đổi từ khóa hoặc bộ lọc</div>
          </div>
        ) : (
          <>
            {/* Result count */}
            <div style={{ fontSize: 13, color: "#888", padding: "2px 4px" }}>
              Hiển thị <strong style={{ color: "#333" }}>{list.length}</strong> sản phẩm
              {q && <> cho "<strong style={{ color: "#EE4D2D" }}>{q}</strong>"</>}
            </div>

            {/* Product grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
              {list.map((p) => {
                const inCart = cartQtyByProductId.get(p._id) || 0;
                const disabled = p.stock <= 0 || inCart >= p.stock;
                return (
                  <div
                    key={p._id}
                    className="pp-product-card"
                    style={{ position: "relative" }}
                    onClick={() => navigate(`/products/${p._id}`)}
                  >
                    {/* In-cart badge */}
                    {inCart > 0 && (
                      <div className="pp-in-cart-badge">Giỏ: {inCart}</div>
                    )}

                    {/* Quick view btn */}
                    <button
                      className="pp-view-btn"
                      onClick={(e) => { e.stopPropagation(); navigate(`/products/${p._id}`); }}
                      type="button"
                    >
                      Xem
                    </button>

                    <img
                      src={p.images?.[0]?.url ? imageUrl(p.images[0].url) : "/"}
                      alt={p.name}
                      className="pp-product-img"
                    />

                    <div className="pp-product-body">
                      {p.category?.name && (
                        <span style={{ fontSize: 11, color: "#aaa" }}>{p.category.name}</span>
                      )}
                      <p className="pp-product-name">{p.name}</p>
                      <p className="pp-product-price">{p.price.toLocaleString("vi-VN")}đ</p>
                      <div className="pp-product-meta">
                        <span style={{ color: "#EE4D2D", fontSize: 11 }}>{p.ratingAverage.toFixed(1)}</span>
                        <StarRating value={p.ratingAverage} />
                        <span>({p.ratingCount})</span>
                        {p.stock <= 5 && p.stock > 0 && (
                          <>
                            <span style={{ color: "#ddd" }}>·</span>
                            <span style={{ color: "#EE4D2D" }}>Còn {p.stock}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      className="pp-add-btn"
                      disabled={disabled}
                      onClick={(e) => { e.stopPropagation(); mergeCart(p); }}
                      type="button"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                      </svg>
                      {disabled ? (p.stock <= 0 ? "Hết hàng" : "Đã đủ") : "Thêm vào giỏ"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0 16px" }}>
                <button
                  className="pp-page-btn"
                  disabled={curPage <= 1}
                  onClick={() => setCurPage((p) => Math.max(1, p - 1))}
                  type="button"
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  const show = page === 1 || page === totalPages || Math.abs(page - curPage) <= 1;
                  const isDot = !show && (page === curPage - 2 || page === curPage + 2);
                  if (isDot) return <span key={page} style={{ color: "#ccc", fontSize: 14 }}>…</span>;
                  if (!show) return null;
                  return (
                    <button
                      key={page}
                      className={`pp-page-btn${curPage === page ? " active" : ""}`}
                      onClick={() => setCurPage(page)}
                      type="button"
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  className="pp-page-btn"
                  disabled={curPage >= totalPages}
                  onClick={() => setCurPage((p) => Math.min(totalPages, p + 1))}
                  type="button"
                >
                  ›
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}