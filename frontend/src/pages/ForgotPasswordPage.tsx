import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { api } from "../services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit() {
    if (!email.trim()) {
      toast.error("Vui lòng nhập email");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email: email.trim() });
      setDone(true);
      toast.success("Nếu email tồn tại, link reset đã được gửi");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Không thể gửi yêu cầu reset");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-2xl border bg-white p-6">
      <h2 className="text-lg font-semibold">Quên mật khẩu</h2>
      <p className="mt-2 text-sm text-zinc-600">
        Nhập email đã đăng ký để nhận link đặt lại mật khẩu.
      </p>

      <div className="mt-4 space-y-3">
        <input
          className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/20"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          type="button"
          onClick={onSubmit}
          disabled={loading}
        >
          {loading ? "Đang gửi..." : "Gửi yêu cầu"}
        </button>
      </div>

      {done && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Kiểm tra hộp thư để lấy link reset.
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

