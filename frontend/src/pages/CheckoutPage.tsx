import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { api } from "../services/api";
import { useAppDispatch, useAppSelector } from "../hooks/useApp";
import { cartActions, setCartItems } from "../redux/cartSlice";
import type { Product } from "../redux/productsSlice";

function imageUrl(url: string) {
  if (!url) return "/";
  if (url.startsWith("http")) return url;
  return `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}${url}`;
}

const PAYMENT_METHODS = [
  { id: "COD", label: "Thanh toán khi nhận hàng", icon: "/payments/cod.png" },
  { id: "VNPAY", label: "VNPay", icon: "/payments/vnpay.png" },
  { id: "MOMO", label: "MoMo", icon: "/payments/momo.png" },
  { id: "PAYPAL", label: "PayPal", icon: "/payments/paypal.png" },
] as const;

export default function CheckoutPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const cartItems = useAppSelector((s) => s.cart.items);
  const [productsById, setProductsById] = useState<Record<string, Product>>({});
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const expandedCart = useMemo(() => {
    return cartItems
      .map((ci) => {
        const p = productsById[ci.productId];
        if (!p) return null;
        return { ...ci, product: p };
      })
      .filter(Boolean) as any[];
  }, [cartItems, productsById]);

  const subtotal = useMemo(
    () => expandedCart.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [expandedCart]
  );

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // Load customer info từ localStorage khi page mount
  useEffect(() => {
    const saved = localStorage.getItem("customerInfo");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setFullName(data.fullName || "");
        setPhone(data.phone || "");
        setAddressLine1(data.addressLine1 || "");
        setAddressLine2(data.addressLine2 || "");
        setCity(data.city || "");
        setProvince(data.province || "");
        setPostalCode(data.postalCode || "");
      } catch {}
    }
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadProducts() {
      if (cartItems.length === 0) return;
      setLoadingProducts(true);
      try {
        const results = await Promise.all(
          cartItems.map(async (ci) => {
            const res = await api.get(`/api/products/${ci.productId}`);
            return [ci.productId, res.data.item];
          })
        );
        if (!alive) return;
        const map: any = {};
        results.forEach(([id, p]) => (map[id] = p));
        setProductsById(map);
      } catch {
        toast.error("Không thể tải sản phẩm");
      } finally {
        if (alive) setLoadingProducts(false);
      }
    }
    loadProducts();
    return () => { alive = false; };
  }, [cartItems]);

  const shippingFee = 0;
  const total = subtotal + shippingFee;

  async function submitOrder() {
    if (!fullName || !phone || !addressLine1 || !city || !province) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setSubmitting(true);

    try {
      // Lưu thông tin khách hàng vào localStorage
      localStorage.setItem(
        "customerInfo",
        JSON.stringify({ fullName, phone, addressLine1, addressLine2, city, province, postalCode })
      );

      // Bước 1: Tạo order
      const orderRes = await api.post("/api/orders", {
        shippingAddress: { fullName, phone, addressLine1, addressLine2, city, province, postalCode },
        paymentMethod,
      });

      const orderId = orderRes.data?.item?._id;

      // Bước 2: VNPAY → gọi /api/payments/vnpay/initiate → lấy payUrl → redirect
      if (paymentMethod === "VNPAY") {
        const payRes = await api.post("/api/payments/vnpay/initiate", { orderId });
        const payUrl = payRes.data?.payUrl;
        if (payUrl) {
          // Không clear cart ở đây
          // Cart sẽ được clear sau khi VNPAY callback về và xác nhận thanh toán thành công
          window.location.href = payUrl;
          return;
        }
        toast.error("Không thể tạo link thanh toán VNPay");
        return;
      }

      // Bước 3: MOMO → gọi /api/payments/momo/initiate → lấy payUrl → redirect
      if (paymentMethod === "MOMO") {
        const payRes = await api.post("/api/payments/momo/initiate", { orderId });
        const payUrl = payRes.data?.payUrl;
        if (payUrl) {
          window.location.href = payUrl;
          return;
        }
        toast.error("Không thể tạo link thanh toán MoMo");
        return;
      }

      // Bước 4: COD / PAYPAL → clear cart và navigate bình thường
      dispatch(cartActions.clearCart());
      dispatch(setCartItems([]));
      toast.success("Đặt hàng thành công");
      navigate("/orders");
    } catch {
      toast.error("Lỗi tạo đơn hàng");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-[#f5f5f5] min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-xl font-semibold mb-4">Thanh toán</h2>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-4">

            {/* ADDRESS */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-zinc-800 mb-5">
                Thông tin giao hàng
              </h3>

              <div className="grid sm:grid-cols-2 gap-5">

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Họ tên *</label>
                  <input
                    className="input"
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Số điện thoại *</label>
                  <input
                    className="input"
                    placeholder="090xxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Địa chỉ *</label>
                  <input
                    className="input"
                    placeholder="Số nhà, tên đường..."
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Địa chỉ bổ sung</label>
                  <input
                    className="input"
                    placeholder="Căn hộ, tầng, ghi chú..."
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Thành phố *</label>
                  <input
                    className="input"
                    placeholder="VD: Hà Nội"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Tỉnh / Quận *</label>
                  <input
                    className="input"
                    placeholder="VD: Cầu Giấy"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Mã bưu điện</label>
                  <input
                    className="input"
                    placeholder="Không bắt buộc"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>

              </div>
            </div>

            {/* PAYMENT */}
            <div className="bg-white rounded-xl p-5 border">
              <h3 className="font-semibold mb-3">Phương thức thanh toán</h3>

              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition ${
                      paymentMethod === m.id
                        ? "border-[#ee4d2d] bg-[#fff4f2]"
                        : "hover:bg-zinc-50"
                    }`}
                  >
                    <img src={m.icon} className="w-8 h-8 object-contain" />
                    <span className="text-sm">{m.label}</span>
                    <div className="ml-auto text-[#ee4d2d] font-bold">
                      {paymentMethod === m.id && "✓"}
                    </div>
                  </div>
                ))}
              </div>

              {(paymentMethod === "VNPAY" || paymentMethod === "MOMO") && (
                <p className="mt-3 text-xs text-zinc-500 bg-zinc-50 rounded-lg px-3 py-2">
                  Bạn sẽ được chuyển đến trang thanh toán của{" "}
                  <span className="font-medium text-zinc-700">
                    {paymentMethod === "VNPAY" ? "VNPay" : "MoMo"}
                  </span>{" "}
                  sau khi xác nhận đơn hàng.
                </p>
              )}
            </div>

            {/* PRODUCTS */}
            <div className="bg-white rounded-xl p-5 border">
              <h3 className="font-semibold mb-3">Sản phẩm</h3>

              {loadingProducts ? (
                <p className="text-sm text-zinc-400 py-4 text-center">Đang tải sản phẩm...</p>
              ) : (
                expandedCart.map((it) => (
                  <div
                    key={it.productId}
                    className="flex justify-between items-center py-2 border-b text-sm"
                  >
                    <div className="flex gap-3 items-center">
                      <img
                        src={imageUrl(it.product.images[0]?.url)}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <div>{it.product.name}</div>
                        <div className="text-xs text-zinc-400">x{it.quantity}</div>
                      </div>
                    </div>
                    <div className="font-medium">
                      {(it.product.price * it.quantity).toLocaleString()}đ
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* RIGHT */}
          <div className="bg-white rounded-xl p-5 border h-fit sticky top-24">

            <div className="flex justify-between text-sm mb-2">
              <span>Tạm tính</span>
              <span>{subtotal.toLocaleString()}đ</span>
            </div>

            <div className="flex justify-between text-sm mb-2">
              <span>Phí ship</span>
              <span>{shippingFee.toLocaleString()}đ</span>
            </div>

            <div className="flex justify-between font-semibold text-lg border-t pt-3">
              <span>Tổng</span>
              <span className="text-[#ee4d2d]">{total.toLocaleString()}đ</span>
            </div>

            <button
              onClick={submitOrder}
              disabled={submitting}
              className="mt-4 w-full bg-[#ee4d2d] text-white py-3 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {submitting
                ? "Đang xử lý..."
                : paymentMethod === "VNPAY"
                ? "Thanh toán qua VNPay"
                : paymentMethod === "MOMO"
                ? "Thanh toán qua MoMo"
                : "Đặt hàng"}
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}