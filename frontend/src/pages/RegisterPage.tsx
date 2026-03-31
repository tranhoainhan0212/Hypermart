import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import Icon from "../components/Icon";
import { useAppDispatch, useAppSelector } from "../hooks/useApp";
import { register } from "../redux/authSlice";

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const auth = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit() {
    try {
      await dispatch(register({ email, password, name })).unwrap();
      toast.success("Tạo tài khoản thành công");
      navigate("/");
    } catch (e: any) {
      toast.error(e || auth.error || "Register failed");
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-2xl border bg-white p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-gradient-to-br from-[#d1fae5] to-[#ecfeff] p-3">
          <Icon name="plus" className="h-6 w-6 text-[var(--brand-600)]" />
        </div>
        <h2 className="text-lg font-semibold">Đăng ký</h2>
      </div>

      <div className="mt-4 space-y-3">
        <input className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/20" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/20" placeholder="Tên (tùy chọn)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/20" type="password" placeholder="Mật khẩu (min 6 ký tự)" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full rounded-xl btn-primary px-4 py-2 text-sm font-medium text-white icon-btn" type="button" onClick={onSubmit} disabled={auth.loading}>
          <Icon name="plus" className="h-4 w-4" />
          <span className="ml-2">{auth.loading ? "Đang tạo..." : "Tạo tài khoản"}</span>
        </button>
      </div>
    </section>
  );
}

