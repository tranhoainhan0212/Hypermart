import { useEffect, useRef, useState, useCallback } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useApp";
import { me, authActions, logout } from "../redux/authSlice";
import { loadCart } from "../redux/cartSlice";
import { api } from "../services/api";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function imgUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}

// ── Icons ────────────────────────────────────────────────────────────────────
const IconCart = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const IconOrder = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IconUser = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconShield = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconChevronDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconSearch = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconMenu = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const IconX = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconClock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

// ── NavItem ──────────────────────────────────────────────────────────────────
function NavItem({ to, label, icon }: { to: string; label: string; icon?: React.ReactNode }) {
  return (
    <NavLink to={to} style={{ textDecoration: "none" }}>
      {({ isActive }) => (
        <div
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            padding: "6px 10px", borderRadius: 8, cursor: "pointer",
            color: isActive ? "white" : "rgba(255,255,255,0.82)",
            background: isActive ? "rgba(255,255,255,0.18)" : "transparent",
            transition: "all 0.18s",
          }}
          onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)"; }}
          onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          {icon && <span style={{ lineHeight: 1 }}>{icon}</span>}
          <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>
        </div>
      )}
    </NavLink>
  );
}

// ── SearchBar ────────────────────────────────────────────────────────────────
const HISTORY_KEY = "search_history";
const MAX_HISTORY = 6;

function getHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function saveHistory(q: string) {
  const prev = getHistory().filter(h => h !== q);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([q, ...prev].slice(0, MAX_HISTORY)));
}
function removeHistory(q: string) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(getHistory().filter(h => h !== q)));
}

function SearchBar() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reload history when focused
  useEffect(() => {
    if (focused) setHistory(getHistory());
  }, [focused]);

  // Debounce API call
  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim() || q.trim().length < 2) { setSuggestions([]); setSearching(false); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get("/api/products", { params: { q: q.trim(), page: 1, limit: 6 } });
        setSuggestions(res.data.items || []);
      } catch { setSuggestions([]); }
      finally { setSearching(false); }
    }, 300);
  }, []);

  useEffect(() => {
    fetchSuggestions(value);
    setActiveIdx(-1);
  }, [value, fetchSuggestions]);

  // Click outside to close
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function doSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    saveHistory(trimmed);
    setHistory(getHistory());
    setFocused(false);
    setValue(trimmed);
    navigate(`/products?q=${encodeURIComponent(trimmed)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const items = value.trim().length >= 2 ? suggestions : history;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && items[activeIdx]) {
        const selected = value.trim().length >= 2 ? items[activeIdx].name : items[activeIdx];
        doSearch(selected);
      } else {
        doSearch(value);
      }
    } else if (e.key === "Escape") {
      setFocused(false);
      inputRef.current?.blur();
    }
  }

  const showDropdown = focused && (value.trim().length >= 2 ? suggestions.length > 0 || searching : history.length > 0);

  return (
    <div ref={wrapRef} style={{ flex: 1, maxWidth: 480, position: "relative" }}>
      <style>{`
        .srch-item { display: flex; align-items: center; gap: 10px; padding: 9px 14px; cursor: pointer; transition: background 0.12s; }
        .srch-item:hover, .srch-item.active { background: #fff4f0; }
        .srch-item:hover .srch-del, .srch-item.active .srch-del { opacity: 1; }
        .srch-del { opacity: 0; transition: opacity 0.15s; background: none; border: none; cursor: pointer; color: #bbb; padding: 2px 4px; border-radius: 3px; font-size: 12px; margin-left: auto; flex-shrink: 0; }
        .srch-del:hover { color: #EE4D2D; background: #fee; }
      `}</style>

      {/* Input + button */}
      <div style={{
        display: "flex", alignItems: "center", background: "white",
        borderRadius: focused ? "8px 8px 0 0" : 8,
        overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        border: "2px solid transparent",
        transition: "border-radius 0.15s",
      }}>
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Tìm sản phẩm, thương hiệu..."
          style={{
            flex: 1, border: "none", outline: "none",
            padding: "10px 14px", fontSize: 13,
            fontFamily: "inherit", color: "#333", background: "transparent",
          }}
        />
        {value && (
          <button
            onClick={() => { setValue(""); setSuggestions([]); inputRef.current?.focus(); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", padding: "0 6px", fontSize: 16, lineHeight: 1 }}
          >×</button>
        )}
        <button
          onClick={() => doSearch(value)}
          style={{
            background: "#EE4D2D", border: "none", cursor: "pointer",
            padding: "10px 16px", color: "white", display: "flex", alignItems: "center",
            transition: "background 0.15s", flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#d73a1e")}
          onMouseLeave={e => (e.currentTarget.style.background = "#EE4D2D")}
        >
          <IconSearch />
        </button>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          background: "#fff", borderRadius: "0 0 8px 8px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.13)",
          zIndex: 200, overflow: "hidden",
          border: "1px solid #f0f0f0", borderTop: "none",
        }}>
          {/* Searching indicator */}
          {searching && (
            <div style={{ padding: "10px 14px", fontSize: 12, color: "#aaa", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid #EE4D2D", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
              Đang tìm...
            </div>
          )}

          {/* Product suggestions */}
          {!searching && value.trim().length >= 2 && suggestions.length > 0 && (
            <>
              <div style={{ padding: "8px 14px 4px", fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Sản phẩm gợi ý
              </div>
              {suggestions.map((p, idx) => (
                <div
                  key={p._id}
                  className={`srch-item${activeIdx === idx ? " active" : ""}`}
                  onMouseDown={() => { navigate(`/products/${p._id}`); setFocused(false); setValue(""); }}
                  onMouseEnter={() => setActiveIdx(idx)}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 4, overflow: "hidden", border: "1px solid #f0f0f0", background: "#f9f9f9", flexShrink: 0 }}>
                    {p.images?.[0]?.url && (
                      <img src={imgUrl(p.images[0].url)} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {/* Highlight matched text */}
                      {(() => {
                        const name = p.name;
                        const q = value.trim();
                        const idx2 = name.toLowerCase().indexOf(q.toLowerCase());
                        if (idx2 === -1) return name;
                        return <>
                          {name.slice(0, idx2)}
                          <strong style={{ color: "#EE4D2D" }}>{name.slice(idx2, idx2 + q.length)}</strong>
                          {name.slice(idx2 + q.length)}
                        </>;
                      })()}
                    </div>
                    <div style={{ fontSize: 12, color: "#EE4D2D", fontWeight: 600, marginTop: 1 }}>
                      {p.price?.toLocaleString("vi-VN")}đ
                    </div>
                  </div>
                </div>
              ))}
              {/* View all link */}
              <div
                className="srch-item"
                style={{ borderTop: "1px solid #f5f5f5", justifyContent: "center" }}
                onMouseDown={() => { doSearch(value); }}
              >
                <span style={{ fontSize: 13, color: "#EE4D2D", fontWeight: 500 }}>
                  Xem tất cả kết quả cho "<strong>{value.trim()}</strong>" →
                </span>
              </div>
            </>
          )}

          {/* Search history (when input empty or < 2 chars) */}
          {value.trim().length < 2 && history.length > 0 && (
            <>
              <div style={{ padding: "8px 14px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Tìm kiếm gần đây</span>
                <button
                  onMouseDown={() => { localStorage.removeItem(HISTORY_KEY); setHistory([]); }}
                  style={{ fontSize: 11, color: "#EE4D2D", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                >Xóa tất cả</button>
              </div>
              {history.map((h, idx) => (
                <div
                  key={h}
                  className={`srch-item${activeIdx === idx ? " active" : ""}`}
                  onMouseDown={() => doSearch(h)}
                  onMouseEnter={() => setActiveIdx(idx)}
                >
                  <span style={{ color: "#bbb", flexShrink: 0 }}><IconClock /></span>
                  <span style={{ fontSize: 13, color: "#444", flex: 1 }}>{h}</span>
                  <button
                    className="srch-del"
                    onMouseDown={e => {
                      e.stopPropagation();
                      removeHistory(h);
                      setHistory(getHistory());
                    }}
                  >✕</button>
                </div>
              ))}
            </>
          )}

          {/* No result */}
          {!searching && value.trim().length >= 2 && suggestions.length === 0 && (
            <div style={{ padding: "16px 14px", textAlign: "center", color: "#aaa", fontSize: 13 }}>
              Không tìm thấy sản phẩm nào cho "<strong style={{ color: "#333" }}>{value}</strong>"
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── MainLayout ───────────────────────────────────────────────────────────────
export default function MainLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const auth = useAppSelector((s) => s.auth);
  const cartItems = useAppSelector((s) => (s as any).cart?.items ?? []);
  const cartCount = cartItems.reduce((sum: number, i: any) => sum + (Number(i.quantity) || 0), 0);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      dispatch(me()).unwrap().catch(() => dispatch(authActions.logoutLocal()));
    }
  }, [dispatch]);

  useEffect(() => {
    if (auth.user) dispatch(loadCart());
  }, [dispatch, auth.user]);

  const handleLogout = () => {
    dispatch(logout()).unwrap().catch(() => dispatch(authActions.logoutLocal()));
    setDropdownOpen(false);
  };

  const displayName = auth.user?.name || auth.user?.email || "";

  return (
    <div style={{ fontFamily: "'Be Vietnam Pro', 'Nunito', sans-serif", minHeight: "100dvh", background: "#f4f4f4", color: "#1a1a1a" }}>

      {/* ── HEADER ── */}
      <header style={{
        background: "linear-gradient(135deg, #ee4d2d 0%, #d73211 100%)",
        boxShadow: "0 2px 16px rgba(238,77,45,0.35)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: "0 20px",
          display: "flex", alignItems: "center", gap: 16, height: 62,
        }}>

          {/* Logo */}
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{
              background: "white", borderRadius: 10, width: 34, height: 34,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontSize: 18,
            }}>🛒</div>
            <span style={{ color: "white", fontWeight: 900, fontSize: 18, letterSpacing: "-0.5px", textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
              HyperMart
            </span>
          </Link>

          {/* Search bar */}
          <SearchBar />

          {/* Desktop nav */}
          <nav style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: "auto" }}>
            <NavItem to="/products" label="Sản phẩm" icon={
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="7" height="7"/><rect x="15" y="3" width="7" height="7"/>
                <rect x="15" y="14" width="7" height="7"/><rect x="2" y="14" width="7" height="7"/>
              </svg>
            } />

            {/* Cart */}
            <NavLink to="/cart" style={{ textDecoration: "none" }}>
              {({ isActive }) => (
                <div
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                    padding: "6px 10px", borderRadius: 8, cursor: "pointer", position: "relative",
                    color: isActive ? "white" : "rgba(255,255,255,0.82)",
                    background: isActive ? "rgba(255,255,255,0.18)" : "transparent",
                    transition: "all 0.18s",
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)"; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <div style={{ position: "relative" }}>
                    <IconCart />
                    {cartCount > 0 && (
                      <span style={{
                        position: "absolute", top: -6, right: -8,
                        background: "white", color: "#ee4d2d",
                        fontSize: 9, fontWeight: 800, borderRadius: "50%",
                        width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                      }}>{cartCount > 9 ? "9+" : cartCount}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>Giỏ hàng</span>
                </div>
              )}
            </NavLink>

            {auth.user && <NavItem to="/orders" label="Đơn hàng" icon={<IconOrder />} />}

            <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.25)", margin: "0 4px" }} />

            {/* Auth */}
            {auth.user ? (
              <div
                style={{ position: "relative" }}
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: dropdownOpen ? "rgba(255,255,255,0.18)" : "transparent",
                  color: "rgba(255,255,255,0.9)", fontFamily: "inherit", transition: "background 0.18s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <IconUser />
                    </div>
                    <IconChevronDown />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {displayName}
                  </span>
                </button>

                {/* Dropdown */}
                <div style={{
                  position: "absolute", top: "100%", right: 0, paddingTop: 8,
                  opacity: dropdownOpen ? 1 : 0,
                  pointerEvents: dropdownOpen ? "auto" : "none",
                  transform: dropdownOpen ? "translateY(0)" : "translateY(-8px)",
                  transition: "opacity 0.2s, transform 0.2s",
                }}>
                  <div style={{ background: "white", borderRadius: 12, minWidth: 196, boxShadow: "0 8px 32px rgba(0,0,0,0.14)", overflow: "hidden" }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: "#222" }}>{displayName}</div>
                      {auth.user.email && auth.user.name && (
                        <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{auth.user.email}</div>
                      )}
                    </div>

                    {[
                      { icon: <IconUser />, label: "Tài khoản của tôi", to: "/account" },
                      { icon: <IconOrder />, label: "Đơn hàng của tôi", to: "/orders" },
                      ...(auth.user?.role === "admin" ? [{ icon: <IconShield />, label: "Quản trị Admin", to: "/admin" }] : []),
                    ].map(item => (
                      <Link key={item.to} to={item.to} onClick={() => setDropdownOpen(false)}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", color: "#555", textDecoration: "none", fontSize: 13, transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#fef5f3")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <span style={{ color: "#ee4d2d" }}>{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}

                    <button onClick={handleLogout} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                      color: "#ee4d2d", background: "transparent", border: "none", cursor: "pointer",
                      width: "100%", fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                      borderTop: "1px solid #f0f0f0", transition: "background 0.15s",
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#fef5f3")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <IconLogout />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                <Link to="/login" style={{ textDecoration: "none", color: "white", padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "1.5px solid rgba(255,255,255,0.5)", transition: "background 0.18s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >Đăng nhập</Link>
                <Link to="/register" style={{ textDecoration: "none", color: "#ee4d2d", padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", transition: "opacity 0.18s" }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >Đăng ký</Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button onClick={() => setMobileOpen(v => !v)} className="mobile-menu-btn"
              style={{ display: "none", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: "white" }}>
              {mobileOpen ? <IconX /> : <IconMenu />}
            </button>
          </nav>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div style={{ background: "rgba(215,50,17,0.98)", borderTop: "1px solid rgba(255,255,255,0.15)", padding: "12px 20px 16px" }}>
            {[
              { to: "/products", label: "Sản phẩm" },
              { to: "/cart", label: `Giỏ hàng${cartCount > 0 ? ` (${cartCount})` : ""}` },
              ...(auth.user ? [
                { to: "/orders", label: "Đơn hàng" },
                { to: "/account", label: "Tài khoản" },
                ...(auth.user.role === "admin" ? [{ to: "/admin", label: "Admin" }] : []),
              ] : [
                { to: "/login", label: "Đăng nhập" },
                { to: "/register", label: "Đăng ký" },
              ]),
            ].map(item => (
              <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                style={{ display: "block", color: "white", textDecoration: "none", padding: "10px 0", fontSize: 15, fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                {item.label}
              </Link>
            ))}
            {auth.user && (
              <button onClick={handleLogout} style={{ display: "block", width: "100%", textAlign: "left", color: "rgba(255,255,255,0.75)", background: "transparent", border: "none", padding: "10px 0", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Đăng xuất
              </button>
            )}
          </div>
        )}
      </header>

      {/* ── MAIN ── */}
      <main><Outlet /></main>

      {/* ── FOOTER ── */}
      <footer style={{ background: "white", borderTop: "1px solid #eee", marginTop: 32 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>🛒</span>
            <span style={{ fontWeight: 800, color: "#ee4d2d", fontSize: 15 }}>HyperMart</span>
          </div>
          <span style={{ fontSize: 13, color: "#aaa" }}>© {new Date().getFullYear()} HyperMart. All rights reserved.</span>
          <div style={{ display: "flex", gap: 16 }}>
            {["Điều khoản", "Bảo mật", "Liên hệ"].map(t => (
              <a key={t} href="#" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#ee4d2d")}
                onMouseLeave={e => (e.currentTarget.style.color = "#888")}
              >{t}</a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @media (max-width: 640px) { .mobile-menu-btn { display: flex !important; } }
      `}</style>
    </div>
  );
}