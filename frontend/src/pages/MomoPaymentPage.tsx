import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAppSelector } from "../hooks/useApp";

interface PaymentStatusResponse {
  orderId: string;
  paymentStatus: "unpaid" | "paid" | "refunded";
  paymentMethod: "COD" | "PAYPAL" | "MOMO" | "VNPAY";
  amount: number;
  orderStatus: string;
}

export default function MomoPaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { orderId: orderIdParam } = useParams<{ orderId: string }>();
  const authUser = useAppSelector((s: any) => s.auth.user);

  const orderId = orderIdParam || "";

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<"success" | "pending" | "failed" | null>(null);

  // 1. Kiểm tra truy cập hợp lệ
  if (!orderId || !authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white shadow-md rounded-lg">
          <p className="text-red-500 font-bold">Truy cập không hợp lệ hoặc phiên đăng nhập hết hạn.</p>
          <button onClick={() => navigate("/")} className="mt-4 text-blue-600 underline">Quay lại trang chủ</button>
        </div>
      </div>
    );
  }

  // 2. Tự động kiểm tra trạng thái khi quay lại từ cổng thanh toán
  useEffect(() => {
    const status = searchParams.get("status");
    const result = searchParams.get("result");
    const vnpResponseCode = searchParams.get("vnp_ResponseCode"); // Hỗ trợ thêm cho VNPay

    // Nếu có dấu hiệu thành công từ URL
    if (result === "success" || status === "success" || vnpResponseCode === "00") {
      setPaymentResult("success");
      verifyPaymentStatus();
    } else if (result === "failed" || status === "failed" || (vnpResponseCode && vnpResponseCode !== "00")) {
      setPaymentResult("failed");
      verifyPaymentStatus();
    } else {
      // Nếu vào trang lần đầu (chưa đi thanh toán), lấy thông tin đơn hàng để hiển thị
      const getInitialStatus = async () => {
        try {
          const { checkPaymentStatus } = await import("../services/payment");
          const statusData = await checkPaymentStatus(orderId);
          setPaymentStatus(statusData);
        } catch (err) {
          console.error("Lỗi lấy thông tin đơn hàng", err);
        }
      };
      getInitialStatus();
    }
  }, [searchParams, orderId]);

  // 3. Hàm xác minh trạng thái thanh toán từ Server
  async function verifyPaymentStatus() {
    setLoading(true);
    try {
      const { checkPaymentStatus } = await import("../services/payment");
      const status = await checkPaymentStatus(orderId);
      setPaymentStatus(status);

      if (status.paymentStatus === "paid") {
        setPaymentResult("success");
        toast.success("Thanh toán thành công!");
        
        // Đợi 2 giây để khách kịp thấy thông báo rồi chuyển sang trang Success xịn
        setTimeout(() => {
          navigate(`/payment-success/${orderId}`);
        }, 2000);
      } else {
        setPaymentResult("failed");
        setError("Giao dịch chưa hoàn tất hoặc đã bị hủy.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Không thể xác minh thanh toán");
      setPaymentResult("failed");
    } finally {
      setLoading(false);
    }
  }

  // 4. Hàm kích hoạt thanh toán (Momo hoặc VNPay)
  async function handlePayNow() {
    setLoading(true);
    setError(null);

    try {
      const { initiateMomoPayment, initiateVnPayPayment, checkPaymentStatus } = await import(
        "../services/payment"
      );

      const status = await checkPaymentStatus(orderId);
      setPaymentStatus(status);

      const returnUrl = `${window.location.origin}/orders/${orderId}/payment`;

      if (status.paymentMethod === "MOMO") {
        const paymentData = await initiateMomoPayment(orderId, returnUrl);
        if (paymentData.payUrl) window.location.href = paymentData.payUrl;
      } else if (status.paymentMethod === "VNPAY") {
        const paymentData = await initiateVnPayPayment(orderId, returnUrl);
        if (paymentData.payUrl) window.location.href = paymentData.payUrl;
      } else {
        setError("Phương thức thanh toán không được hỗ trợ");
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || "Khởi tạo thanh toán thất bại";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-sm ${
            paymentStatus?.paymentMethod === "MOMO" ? "bg-pink-100 text-pink-600" : "bg-blue-100 text-blue-600"
          }`}>
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-gray-800">
            {paymentStatus?.paymentMethod === "VNPAY" ? "Thanh toán VNPay" : "Thanh toán Momo"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Hệ thống thanh toán an toàn & bảo mật</p>
        </div>

        {/* Order Details Card */}
        {paymentStatus && (
          <div className="bg-slate-50 rounded-xl p-5 mb-8 border border-slate-100">
            <div className="flex justify-between mb-3">
              <span className="text-gray-500 text-sm">Mã đơn hàng:</span>
              <span className="font-mono font-bold text-gray-700">#{orderId.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Số tiền cần trả:</span>
              <span className="text-xl font-black text-gray-900">
                {paymentStatus.amount.toLocaleString()} VND
              </span>
            </div>
          </div>
        )}

        {/* Dynamic Result Notifications */}
        {paymentResult === "success" && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mb-6 animate-pulse">
            <div className="bg-green-500 text-white rounded-full p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <span className="text-green-800 font-bold">Thanh toán thành công! Đang chuyển hướng...</span>
          </div>
        )}

        {paymentResult === "failed" && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl mb-6">
            <p className="text-red-700 text-sm font-medium text-center">{error || "Giao dịch thất bại. Vui lòng thử lại."}</p>
          </div>
        )}

        {/* Call to Actions */}
        <div className="space-y-3">
          {!paymentResult && (
            <>
              <button
                onClick={handlePayNow}
                disabled={loading}
                className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
                  paymentStatus?.paymentMethod === "MOMO" ? "bg-[#A50064] hover:bg-[#820050]" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? (
                   <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  `Thanh toán ngay`
                )}
              </button>
              <button
                onClick={() => navigate(`/orders/${orderId}`)}
                className="w-full py-4 text-gray-500 font-semibold hover:text-gray-700 transition"
              >
                Để sau
              </button>
            </>
          )}

          {paymentResult === "failed" && (
            <button
              onClick={handlePayNow}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all"
            >
              Thử thanh toán lại
            </button>
          )}
        </div>

        {/* Security Trust Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
            SSL Secure Payment
          </div>
        </div>
      </div>
    </div>
  );
}