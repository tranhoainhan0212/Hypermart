import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { api } from "../services/api";

export default function ResetPasswordPage() {
  const [search] = useSearchParams();
  const email = useMemo(() => (search.get("email") || "").trim(), [search]);
  const token = useMemo(() => (search.get("token") || "").trim(), [search]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit() {
    if (!email || !token) {
      toast.error("Link reset không hợp lệ hoặc thiếu thông tin");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", {
        email,
        token,
        newPassword,
      });
      setDone(true);
      toast.success("Đặt lại mật khẩu thành công");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Không thể đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-2xl border bg-white p-6">
      <h2 className="text-lg font-semibold">Đặt lại mật khẩu</h2>
      <p className="mt-2 text-sm text-zinc-600">Tạo mật khẩu mới cho tài khoản của bạn.</p>

      {!email || !token ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Link reset không hợp lệ.
        </div>
      ) : (
        <>
          <div className="mt-4 rounded-xl border bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            Email: <span className="font-medium">{email}</span>
          </div>
          <div className="mt-4 space-y-3">
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/20"
              type="password"
              placeholder="Mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/20"
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              type="button"
              onClick={onSubmit}
              disabled={loading || done}
            >
              {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </button>
          </div>
        </>
      )}

      {done && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Mật khẩu đã được cập nhật. Bạn có thể đăng nhập lại.
        </div>
      )}

      <div className="mt-4 text-sm">
        <Link to="/login" className="text-zinc-700 underline">
          Quay lại đăng nhập
        </Link>
      </div>
    </section>
  );
}

