import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Helmet } from "react-helmet-async";
import { useDispatch, useSelector } from "react-redux";

import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import AccountPage from "./pages/AccountPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import MomoPaymentPage from "./pages/MomoPaymentPage";
// ✅ Import trang thành công mới ở đây
import PaymentSuccessPage from "./pages/PaymentSuccessPage"; 
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import RequireAuth from "./routes/RequireAuth";
import { me } from "./redux/authSlice";

export default function App() {
  const dispatch = useDispatch();
  const { user, accessToken, loading } = useSelector((state: any) => state.auth);

  // ✅ Kiểm tra authentication khi app khởi động
  useEffect(() => {
    if (accessToken && !user) {
      dispatch(me() as any);
    }
  }, [accessToken, user, dispatch]);

  return (
    <>
      <Helmet>
        <title>E-Commerce | Hutech Project</title>
      </Helmet>

      <Toaster position="top-right" />

      {/* ✅ Hiển thị loading khi đang kiểm tra authentication */}
      {loading && accessToken && !user ? (
        <div className="flex items-center justify-center min-h-screen bg-white">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <p className="mt-4 text-gray-600 font-medium">Đang xác thực tài khoản...</p>
          </div>
        </div>
      ) : (
        <Routes>
          <Route element={<MainLayout />}>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:idOrSlug" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth-callback" element={<AuthCallbackPage />} />

            {/* Protected Routes (Cần đăng nhập) */}
            <Route element={<RequireAuth />}>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/account" element={<AccountPage />} />
              
              {/* Luồng thanh toán */}
              <Route path="/orders/:orderId/payment" element={<MomoPaymentPage />} />
              
              {/* ✅ Route trang thông báo thành công sau thanh toán */}
              <Route path="/payment-success/:orderId" element={<PaymentSuccessPage />} />
            </Route>

            {/* Page Not Found: Redirect về Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<RequireAuth role="admin" />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
          </Route>
        </Routes>
      )}
    </>
  );
}