import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import Icon from "../components/Icon";
import { useAppDispatch, useAppSelector } from "../hooks/useApp";
import { api } from "../services/api";
import { me } from "../redux/authSlice";

export default function AccountPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  async function saveProfile() {
    if (!user) return;
    const nextName = name.trim();
    if (nextName.length > 80) {
      toast.error("Tên quá dài");
      return;
    }
    setSaving(true);
    try {
      await api.put("/api/auth/me", { name: nextName });
      await dispatch(me()).unwrap();
      toast.success("Cập nhật thành công");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Không thể cập nhật");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl rounded-2xl border bg-white p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-gradient-to-br from-[#d1fae5] to-[#ecfeff] p-3">
          <Icon name="home" className="h-6 w-6 text-[var(--brand-600)]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Tài khoản</h2>
          <p className="mt-1 text-sm text-zinc-600">Xem và cập nhật thông tin cá nhân.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl border bg-zinc-50 px-3 py-2 text-sm text-zinc-700">Email: <span className="font-medium">{user?.email}</span></div>
        <div className="rounded-xl border bg-zinc-50 px-3 py-2 text-sm text-zinc-700">Role: <span className="font-medium">{user?.role}</span></div>

        <div>
          <label className="text-sm font-medium text-zinc-700">Tên hiển thị</label>
          <input className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/20" placeholder="Tên" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <button className="w-full rounded-xl btn-primary px-4 py-2 text-sm font-medium text-white icon-btn" type="button" onClick={saveProfile} disabled={saving}>
          <Icon name="plus" className="h-4 w-4" />
          <span className="ml-2">{saving ? "Đang lưu..." : "Lưu thay đổi"}</span>
        </button>
      </div>
    </section>
  );
}

