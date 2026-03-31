import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { useAppDispatch, useAppSelector } from "../hooks/useApp";
import { login } from "../redux/authSlice";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function onSubmit() {
    if (!email.trim() || !password) { toast.error("Vui lòng nhập đầy đủ thông tin"); return; }
    try {
      await dispatch(login({ email, password })).unwrap();
      toast.success("Đăng nhập thành công");
      const from = (location.state as any)?.from as string | undefined;
      navigate(from || "/", { replace: true });
    } catch (e: any) {
      toast.error(e || auth.error || "Đăng nhập thất bại");
    }
  }

  function handleGoogle() {
    // Redirect đến OAuth endpoint của backend
    window.location.href = `${API_BASE}/api/auth/oauth/google`;
  }

  function handleFacebook() {
    // Redirect đến OAuth endpoint của backend
    window.location.href = `${API_BASE}/api/auth/oauth/facebook`;
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#f5f5f5", display: "flex",
      alignItems: "center", justifyContent: "center", padding: "20px 16px",
      fontFamily: "'Be Vietnam Pro', sans-serif",
    }}>
      <style>{`
        .lp-input {
          width: 100%; box-sizing: border-box; height: 44px;
          border: 1px solid #e0e0e0; border-radius: 4px; padding: 0 42px 0 14px;
          font-size: 14px; outline: none; font-family: inherit; color: #333;
          background: #fff; transition: border-color 0.15s;
        }
        .lp-input:focus { border-color: #EE4D2D; box-shadow: 0 0 0 2px rgba(238,77,45,0.08); }
        .lp-btn-main {
          width: 100%; height: 44px; background: #EE4D2D; color: #fff; border: none;
          border-radius: 4px; font-size: 15px; font-weight: 600; cursor: pointer;
          font-family: inherit; transition: background 0.15s; letter-spacing: 0.2px;
        }
        .lp-btn-main:hover:not(:disabled) { background: #d73a1e; }
        .lp-btn-main:disabled { opacity: 0.55; cursor: not-allowed; }
        .lp-btn-social {
          width: 100%; height: 42px; background: #fff; border: 1px solid #e0e0e0;
          border-radius: 4px; font-size: 13px; font-weight: 500; cursor: pointer;
          font-family: inherit; display: flex; align-items: center; justify-content: center;
          gap: 10px; color: #333; transition: all 0.15s;
        }
        .lp-btn-social:hover { border-color: #bbb; background: #fafafa; }
        .lp-divider {
          display: flex; align-items: center; gap: 12px; margin: 6px 0;
        }
        .lp-divider::before, .lp-divider::after {
          content: ""; flex: 1; height: 1px; background: #ebebeb;
        }
        .lp-eye-btn {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #aaa; padding: 0;
          display: flex; align-items: center;
        }
        .lp-eye-btn:hover { color: #555; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Link to="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 36, height: 36, background: "#EE4D2D", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 800 }}>H</div>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#EE4D2D" }}>HyperMart</span>
          </Link>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: 4, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: "28px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#222" }}>Đăng nhập</h2>
            <Link to="/register" style={{ fontSize: 13, color: "#EE4D2D", textDecoration: "none", fontWeight: 500 }}>
              Tạo tài khoản
            </Link>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ position: "relative" }}>
              <input
                className="lp-input"
                style={{ paddingRight: 14 }}
                placeholder="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && onSubmit()}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ position: "relative" }}>
              <input
                className="lp-input"
                placeholder="Mật khẩu"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && onSubmit()}
                autoComplete="current-password"
              />
              <button className="lp-eye-btn" type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                {showPass ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div style={{ textAlign: "right", marginBottom: 18 }}>
            <Link to="/forgot-password" style={{ fontSize: 12, color: "#888", textDecoration: "none" }}>
              Quên mật khẩu?
            </Link>
          </div>

          {/* Submit */}
          <button className="lp-btn-main" type="button" onClick={onSubmit} disabled={auth.loading}>
            {auth.loading ? "Đang đăng nhập..." : "ĐĂNG NHẬP"}
          </button>

          {/* Divider */}
          <div className="lp-divider" style={{ marginTop: 20, marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: "#bbb", whiteSpace: "nowrap" }}>hoặc đăng nhập với</span>
          </div>

          {/* Social */}
          <div style={{ display: "flex", gap: 10 }}>
            <button className="lp-btn-social" onClick={handleGoogle} type="button">
              <GoogleIcon />
              Google
            </button>
            <button className="lp-btn-social" onClick={handleFacebook} type="button">
              <FacebookIcon />
              Facebook
            </button>
          </div>
        </div>

        {/* Register link */}
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#888" }}>
          Chưa có tài khoản?{" "}
          <Link to="/register" style={{ color: "#EE4D2D", textDecoration: "none", fontWeight: 600 }}>
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}