import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch } from "../hooks/useApp";
import { setAccessToken, me } from "../redux/authSlice";
import { toast } from "react-hot-toast";
import axios from "axios";

export default function AuthCallbackPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    // ❌ Handle error từ backend
    if (error) {
      const errorMessages: Record<string, string> = {
        google_auth_failed: "Đăng nhập Google thất bại",
        facebook_auth_failed: "Đăng nhập Facebook thất bại",
        google_auth_cancelled: "Đã hủy đăng nhập Google",
        facebook_auth_cancelled: "Đã hủy đăng nhập Facebook",
        callback_error: "Có lỗi xảy ra, vui lòng thử lại",
      };

      toast.error(errorMessages[error] || "Đăng nhập thất bại");
      navigate("/login", { replace: true });
      return;
    }

    // ❌ Không có token
    if (!token) {
      toast.error("Token không hợp lệ");
      navigate("/login", { replace: true });
      return;
    }

    // ✅ Lưu token
    localStorage.setItem("accessToken", token);

    // ✅ Set vào axios header (QUAN TRỌNG)
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // ✅ Redux store
    dispatch(setAccessToken(token));

    // ✅ CSRF nếu có
    const csrf = searchParams.get("csrf");
    if (csrf) {
      const maxAge = 7 * 24 * 60 * 60;
      const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `csrfToken=${csrf}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secureFlag}`;
    }

    // ✅ Gọi API lấy user
    dispatch(me())
      .unwrap()
      .then(() => {
        toast.success("Đăng nhập thành công");

        // ✅ Clear query param (tránh lộ token)
        window.history.replaceState({}, document.title, "/");

        navigate("/", { replace: true });
      })
      .catch(() => {
        toast.error("Không lấy được thông tin user");

        // ❌ Xoá token nếu fail
        localStorage.removeItem("accessToken");
        delete axios.defaults.headers.common["Authorization"];

        navigate("/login", { replace: true });
      });

  }, [searchParams, navigate, dispatch]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
        fontFamily: "'Be Vietnam Pro', sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#333",
            marginBottom: 12,
          }}
        >
          Đang xử lý đăng nhập...
        </div>

        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#EE4D2D",
                animation: `pulse 1.4s infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}