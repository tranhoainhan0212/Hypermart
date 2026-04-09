import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";


import { api } from "../services/api";
import { useAppDispatch, useAppSelector } from "../hooks/useApp";
import { fetchProductByIdOrSlug, type Product } from "../redux/productsSlice";
import { cartActions, setCartItems } from "../redux/cartSlice";

type Review = {
  _id: string;
  user: { _id: string; name: string; email: string };
  rating: number;
  comment: string;
  createdAt: string;
};

function imageUrl(url: string) {
  if (!url) return "/";
  if (url.startsWith("http")) return url;
  return `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}${url}`;
}

function StarIcon({ filled, half = false }: { filled: boolean; half?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", flexShrink: 0 }}
    >
      {half ? (
        <>
          <defs>
            <linearGradient id="half-fill">
              <stop offset="50%" stopColor="#EE4D2D" />
              <stop offset="50%" stopColor="#e5e7eb" />
            </linearGradient>
          </defs>
          <path
            d="M7 1l1.545 3.13 3.455.502-2.5 2.437.59 3.44L7 8.885l-3.09 1.624.59-3.44L2 4.632l3.455-.502L7 1z"
            fill="url(#half-fill)"
            stroke="url(#half-fill)"
            strokeWidth="0.5"
          />
        </>
      ) : (
        <path
          d="M7 1l1.545 3.13 3.455.502-2.5 2.437.59 3.44L7 8.885l-3.09 1.624.59-3.44L2 4.632l3.455-.502L7 1z"
          fill={filled ? "#EE4D2D" : "#e5e7eb"}
          stroke={filled ? "#EE4D2D" : "#d1d5db"}
          strokeWidth="0.5"
        />
      )}
    </svg>
  );
}

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
      {Array.from({ length: max }).map((_, i) => (
        <StarIcon key={i} filled={i < Math.floor(value)} />
      ))}
    </span>
  );
}

function Avatar({ name, email }: { name?: string; email?: string }) {
  const label = (name || email || "?")[0].toUpperCase();
  const colors = ["#EE4D2D", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];
  const idx = label.charCodeAt(0) % colors.length;
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: colors[idx],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 600,
        fontSize: 14,
        flexShrink: 0,
      }}
    >
      {label}
    </div>
  );
}

export default function ProductDetailPage() {
  const { idOrSlug } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const product = useAppSelector((s) => s.products.currentProduct);
  const loading = useAppSelector((s) => s.products.currentLoading);
  const cartItems = useAppSelector((s) => s.cart.items);
  const authUser = useAppSelector((s) => s.auth.user);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const cartQtyByProductId = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of cartItems) m.set(i.productId, i.quantity);
    return m;
  }, [cartItems]);

  useEffect(() => {
    if (!idOrSlug) return;
    dispatch(fetchProductByIdOrSlug({ idOrSlug }))
      .unwrap()
      .catch(() => toast.error("Không tìm thấy sản phẩm"));
  }, [dispatch, idOrSlug]);

  useEffect(() => {
    if (!product?._id) return;
    setReviewsLoading(true);
    api
      .get("/api/reviews", { params: { productId: product._id, limit: 50, page: 1 } })
      .then((res) => setReviews((res.data.items || []) as Review[]))
      .catch(() => toast.error("Không tải được đánh giá"))
      .finally(() => setReviewsLoading(false));
  }, [product?._id]);

  function addToCart(p: Product) {
    const existing = cartQtyByProductId.get(p._id) || 0;
    if (p.stock <= existing) {
      toast.error("Không đủ tồn kho");
      return;
    }
    const nextQty = existing + 1;
    const nextItems = cartItems.some((i) => i.productId === p._id)
      ? cartItems.map((i) => (i.productId === p._id ? { ...i, quantity: nextQty } : i))
      : [...cartItems, { productId: p._id, quantity: 1 }];
    dispatch(cartActions.setItems(nextItems));
    dispatch(setCartItems(nextItems));
    toast.success("Đã thêm vào giỏ hàng");
  }

  async function submitReview() {
    if (!product?._id) return;
    if (!authUser) {
      toast.error("Vui lòng đăng nhập để đánh giá");
      navigate("/login");
      return;
    }
    setSubmittingReview(true);
    try {
      await api.post("/api/reviews/me", {
        productId: product._id,
        rating,
        comment: comment.trim(),
      });
      toast.success("Cập nhật đánh giá thành công");
      setComment("");
      const res = await api.get("/api/reviews", { params: { productId: product._id, limit: 50, page: 1 } });
      setReviews((res.data.items || []) as Review[]);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Không thể gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  }

  async function deleteReview(reviewId: string) {
    if (!authUser) return;
    try {
      await api.delete(`/api/reviews/me/${reviewId}`);
      toast.success("Đã xóa đánh giá");
      const res = await api.get("/api/reviews", { params: { productId: product?._id, limit: 50, page: 1 } });
      setReviews((res.data.items || []) as Review[]);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Không thể xóa đánh giá");
    }
  }

  const inCart = product ? cartQtyByProductId.get(product._id) || 0 : 0;
  const outOfStock = product ? product.stock <= inCart : false;

  const ratingCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    for (const r of reviews) counts[r.rating - 1]++;
    return counts.reverse();
  }, [reviews]);

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh", padding: "12px 0" }}>
      <style>{`
        .pd-card { background: #fff; border-radius: 4px; }
        .pd-thumb-btn { border: 2px solid transparent; border-radius: 4px; cursor: pointer; padding: 0; background: none; overflow: hidden; transition: border-color 0.15s; }
        .pd-thumb-btn.active { border-color: #EE4D2D; }
        .pd-thumb-btn:hover:not(.active) { border-color: #ccc; }
        .pd-btn-cart {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 0 32px; height: 48px; border-radius: 4px; font-size: 15px; font-weight: 500;
          cursor: pointer; border: 1.5px solid #EE4D2D; transition: opacity 0.15s, background 0.15s;
        }
        .pd-btn-cart.ghost { background: #fff4f0; color: #EE4D2D; }
        .pd-btn-cart.ghost:hover:not(:disabled) { background: #ffe8e2; }
        .pd-btn-cart.solid { background: #EE4D2D; color: #fff; }
        .pd-btn-cart.solid:hover:not(:disabled) { background: #d73a1e; }
        .pd-btn-cart:disabled { opacity: 0.4; cursor: not-allowed; }
        .pd-star-interactive { cursor: pointer; transition: transform 0.1s; }
        .pd-star-interactive:hover { transform: scale(1.2); }
        .pd-review-card { border-bottom: 1px solid #f0f0f0; padding: 20px 0; }
        .pd-review-card:last-child { border-bottom: none; }
        .pd-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 2px; font-size: 12px; font-weight: 500; }
        .pd-del-btn { font-size: 12px; color: #888; border: 1px solid #e0e0e0; background: none; padding: 4px 12px; border-radius: 2px; cursor: pointer; transition: background 0.15s, color 0.15s; }
        .pd-del-btn:hover { background: #fff0ee; color: #EE4D2D; border-color: #EE4D2D; }
        .rating-bar-fill { background: #EE4D2D; border-radius: 2px; height: 100%; transition: width 0.4s; }
        .pd-textarea { width: 100%; box-sizing: border-box; border: 1px solid #e0e0e0; border-radius: 4px; padding: 12px 14px; font-size: 14px; resize: vertical; outline: none; font-family: inherit; line-height: 1.6; transition: border-color 0.15s; }
        .pd-textarea:focus { border-color: #EE4D2D; }
        .pd-submit-btn { padding: 0 28px; height: 42px; background: #EE4D2D; color: #fff; border: none; border-radius: 4px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.15s; }
        .pd-submit-btn:hover:not(:disabled) { background: #d73a1e; }
        .pd-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .pd-breadcrumb a { color: #888; font-size: 13px; text-decoration: none; }
        .pd-breadcrumb a:hover { color: #EE4D2D; }
        .pd-breadcrumb span { color: #ccc; margin: 0 6px; font-size: 13px; }
      `}</style>

      {/* Breadcrumb */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px 10px" }}>
        <nav className="pd-breadcrumb" style={{ display: "flex", alignItems: "center" }}>
          <a href="/">Trang chủ</a>
          <span>/</span>
          {product?.category?.name && (
            <>
              <a href="#">{product.category.name}</a>
              <span>/</span>
            </>
          )}
          <span style={{ color: "#444", fontSize: 13 }}>{product?.name || "..."}</span>
        </nav>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 16px", textAlign: "center", color: "#888" }}>
          Đang tải sản phẩm...
        </div>
      )}
      {!loading && !product && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 16px", textAlign: "center", color: "#EE4D2D" }}>
          Không tìm thấy sản phẩm
        </div>
      )}

      {!loading && product && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* ── Main product card ── */}
          <div className="pd-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>

              {/* Gallery */}
              <div style={{ flexShrink: 0, width: 400 }}>
                <div style={{ width: "100%", aspectRatio: "1", borderRadius: 4, overflow: "hidden", border: "1px solid #f0f0f0", marginBottom: 12 }}>
                  <img
                    src={product.images?.[selectedImage]?.url ? imageUrl(product.images[selectedImage].url) : "/"}
                    alt={product.name}
                    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                  />
                </div>
                {product.images?.length > 1 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {product.images.slice(0, 6).map((img, idx) => (
                      <button
                        key={`${img.url}-${idx}`}
                        className={`pd-thumb-btn${selectedImage === idx ? " active" : ""}`}
                        onClick={() => setSelectedImage(idx)}
                        type="button"
                        style={{ width: 64, height: 64 }}
                      >
                        <img
                          src={imageUrl(img.url)}
                          alt={img.alt || product.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 280 }}>
                {/* Category badge */}
                {product.category?.name && (
                  <div style={{ marginBottom: 8 }}>
                    <span className="pd-badge" style={{ background: "#fff4f0", color: "#EE4D2D" }}>
                      {product.category.name}
                    </span>
                  </div>
                )}

                <h1 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 600, color: "#222", lineHeight: 1.4 }}>
                  {product.name}
                </h1>

                {/* Rating summary row */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #f5f5f5" }}>
                  <span style={{ color: "#EE4D2D", fontWeight: 600, fontSize: 15, textDecoration: "underline" }}>
                    {product.ratingAverage.toFixed(1)}
                  </span>
                  <StarRating value={product.ratingAverage} />
                  <span style={{ color: "#767676", fontSize: 14 }}>
                    {product.ratingCount} đánh giá
                  </span>
                  <div style={{ width: 1, height: 14, background: "#e0e0e0" }} />
                  <span style={{ color: "#767676", fontSize: 14 }}>
                    {product.stock} trong kho
                  </span>
                </div>

                {/* Price block */}
                <div style={{ background: "#fafafa", borderRadius: 4, padding: "16px 20px", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 30, fontWeight: 600, color: "#EE4D2D" }}>
                      {product.price.toLocaleString("vi-VN")}
                      <span style={{ fontSize: 18 }}>đ</span>
                    </span>
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 14, color: "#555", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {product.description}
                    </div>
                  </div>
                )}

                {/* Stock status */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                  <span style={{ fontSize: 14, color: "#767676", minWidth: 80 }}>Tình trạng</span>
                  <span style={{
                    fontSize: 13, fontWeight: 500,
                    color: product.stock > 0 ? "#26aa99" : "#EE4D2D",
                    background: product.stock > 0 ? "#e8f7f5" : "#fff0ee",
                    padding: "3px 10px", borderRadius: 2
                  }}>
                    {product.stock > 0 ? `Còn hàng (${product.stock})` : "Hết hàng"}
                  </span>
                </div>

                {/* In cart indicator */}
                {inCart > 0 && (
                  <div style={{ fontSize: 13, color: "#767676", marginBottom: 16 }}>
                    Đã có <strong style={{ color: "#EE4D2D" }}>{inCart}</strong> sản phẩm trong giỏ hàng
                  </div>
                )}

                {/* CTA Buttons */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button
                    className="pd-btn-cart ghost"
                    disabled={outOfStock}
                    onClick={() => addToCart(product)}
                    type="button"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    Thêm vào giỏ
                  </button>
                  <button
                    className="pd-btn-cart solid"
                    onClick={() => navigate("/cart")}
                    type="button"
                  >
                    Xem giỏ hàng
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Reviews card ── */}
          <div className="pd-card" style={{ padding: 24 }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 600, color: "#222" }}>
              ĐÁNH GIÁ SẢN PHẨM
            </h2>

            {/* Rating overview */}
            {reviews.length > 0 && (
              <div style={{ background: "#fffaf9", border: "1px solid #fee", borderRadius: 4, padding: 24, marginBottom: 28, display: "flex", gap: 40, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 40, fontWeight: 700, color: "#EE4D2D", lineHeight: 1 }}>
                    {product.ratingAverage.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 13, color: "#767676", marginTop: 4 }}>trên 5</div>
                  <div style={{ marginTop: 8 }}>
                    <StarRating value={product.ratingAverage} />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  {[5, 4, 3, 2, 1].map((star, idx) => {
                    const count = ratingCounts[idx];
                    const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={star} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: "#EE4D2D", minWidth: 20, textAlign: "right" }}>{star}</span>
                        <svg width="12" height="12" viewBox="0 0 14 14"><path d="M7 1l1.545 3.13 3.455.502-2.5 2.437.59 3.44L7 8.885l-3.09 1.624.59-3.44L2 4.632l3.455-.502L7 1z" fill="#EE4D2D" /></svg>
                        <div style={{ flex: 1, height: 8, background: "#f0f0f0", borderRadius: 2, overflow: "hidden" }}>
                          <div className="rating-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span style={{ fontSize: 12, color: "#767676", minWidth: 24 }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Write review */}
            <div style={{ background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 4, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: "#333", marginBottom: 14 }}>
                Viết đánh giá của bạn
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: "#767676", marginBottom: 8 }}>Chất lượng sản phẩm</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="pd-star-interactive"
                      style={{ background: "none", border: "none", padding: 2, cursor: "pointer" }}
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      <svg width="28" height="28" viewBox="0 0 14 14">
                        <path
                          d="M7 1l1.545 3.13 3.455.502-2.5 2.437.59 3.44L7 8.885l-3.09 1.624.59-3.44L2 4.632l3.455-.502L7 1z"
                          fill={s <= (hoverRating || rating) ? "#EE4D2D" : "#e5e7eb"}
                          stroke={s <= (hoverRating || rating) ? "#EE4D2D" : "#d1d5db"}
                          strokeWidth="0.5"
                        />
                      </svg>
                    </button>
                  ))}
                  <span style={{ fontSize: 13, color: "#767676", alignSelf: "center", marginLeft: 4 }}>
                    {["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Xuất sắc"][hoverRating || rating]}
                  </span>
                </div>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ nhận xét về sản phẩm này với người mua khác..."
                className="pd-textarea"
                rows={4}
              />
              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="pd-submit-btn"
                  disabled={submittingReview}
                  onClick={submitReview}
                  type="button"
                >
                  {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
              </div>
            </div>

            {/* Review list */}
            {reviewsLoading ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: "#888", fontSize: 14 }}>
                Đang tải đánh giá...
              </div>
            ) : reviews.length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: "#bbb", fontSize: 14 }}>
                Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!
              </div>
            ) : (
              <div>
                {reviews.map((r) => (
                  <div key={r._id} className="pd-review-card">
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <Avatar name={r.user.name} email={r.user.email} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: 14, color: "#333" }}>
                            {r.user.name || r.user.email}
                          </span>
                          {authUser && r.user._id === authUser.id && (
                            <button
                              className="pd-del-btn"
                              onClick={() => deleteReview(r._id)}
                              type="button"
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <StarRating value={r.rating} />
                          <span style={{ fontSize: 12, color: "#ccc" }}>|</span>
                          <span style={{ fontSize: 12, color: "#bbb" }}>
                            {new Date(r.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                          </span>
                        </div>
                        {r.comment && (
                          <p style={{ margin: 0, fontSize: 14, color: "#555", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                            {r.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}