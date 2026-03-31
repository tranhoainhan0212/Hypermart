import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppSelector } from "../hooks/useApp";
import Confetti from "react-confetti"; // Optional: Cài thêm npm install react-confetti để có hiệu ứng pháo hoa
import { useWindowSize } from "react-use"; // Optional: npm install react-use

interface OrderDetails {
  orderId: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const authUser = useAppSelector((s: any) => s.auth.user);
  const { width, height } = useWindowSize();

  const [orderInfo, setOrderInfo] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrderSuccess() {
      try {
        const { checkPaymentStatus } = await import("../services/payment");
        const status = await checkPaymentStatus(orderId || "");
        setOrderInfo(status);
      } catch (err) {
        console.error("Failed to fetch order info", err);
      } finally {
        setLoading(false);
      }
    }

    if (orderId) fetchOrderSuccess();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Hiệu ứng pháo hoa ăn mừng (Chỉ hiện trong 5s) */}
      <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />

      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 relative overflow-hidden">
        {/* Decor: Dải màu xanh ở trên cùng */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-green-500"></div>

        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 shadow-inner">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Thanh toán thành công!</h1>
          <p className="text-gray-500 mt-2">
            Cảm ơn bạn đã mua sắm. Đơn hàng của bạn đã được xác nhận.
          </p>
        </div>

        {/* Order Summary Card */}
        <div className="border border-gray-100 rounded-xl p-6 mb-8 bg-slate-50">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
            Chi tiết giao dịch
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Mã đơn hàng:</span>
              <span className="font-mono font-bold text-gray-900 uppercase">
                #{orderId?.slice(-8)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-4">
              <span className="text-gray-600">Tổng cộng:</span>
              <span className="text-2xl font-black text-green-600">
                {orderInfo?.amount.toLocaleString()} VND
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Phương thức:</span>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-white border rounded-md text-xs font-bold text-gray-700 shadow-sm">
                  {orderInfo?.paymentMethod}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Thời gian:</span>
              <span className="text-sm text-gray-800">
                {new Date().toLocaleString("vi-VN")}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => navigate(`/orders/${orderId}`)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95"
          >
            Theo dõi đơn hàng
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-600 font-bold py-4 rounded-xl transition-all"
          >
            Tiếp tục mua sắm
          </button>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-xs text-gray-400">
          Một email xác nhận đã được gửi tới <strong>{authUser?.email}</strong>. <br />
          Nếu có thắc mắc, vui lòng liên hệ hỗ trợ 24/7.
        </p>
      </div>
    </div>
  );
}