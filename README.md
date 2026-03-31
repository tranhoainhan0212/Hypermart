# E-Commerce (React + Express + MongoDB)

Hệ thống thương mại điện tử demo gồm:
- Backend: Node.js + Express RESTful API, JWT (access token) + refresh token cookie, upload ảnh (local), MongoDB (Mongoose), Momo Payment
- Frontend: React (Hooks) + React Router, Redux Toolkit, Axios, TailwindCSS, toast, Helmet
- Admin Features: User management, Product CRUD with images, Advanced dashboard

---

## 📚 Tài Liệu (Documentation)

**➤ [QUICK_START.md](QUICK_START.md)** ⭐ **[BẮT ĐẦU TẠI ĐÂY]**
- Hướng dẫn chi tiết từng bước vận hành ứng dụng
- Cài đặt Node.js, MongoDB (local & Atlas)
- Chạy backend & frontend
- Kiểm tra API, xử lý lỗi thường gặp

**➤ [ARCHITECTURE.md](ARCHITECTURE.md)** 🏗️
- Sơ đồ kiến trúc ứng dụng
- Quy trình luồng dữ liệu
- Cấu trúc thư mục chi tiết
- API endpoints tóm tắt
- Lệnh và công cụ hữu ích

**➤ [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** ✨
- Chi tiết các tính năng đã cài đặt
- Admin user management
- Product CRUD & image handling
- Momo payment integration
- CSRF security enhancements

**➤ [ENV_SETUP.md](ENV_SETUP.md)** ⚙️
- Hướng dẫn cấu hình biến môi trường
- Momo payment setup chi tiết
- Các thông số cần thiết

**➤ [docs/API.md](docs/API.md)** 📖
- API reference chi tiết

**➤ [docs/DB_SCHEMA.md](docs/DB_SCHEMA.md)** 🗄️
- Database schema toàn bộ

---

## Kiến trúc & luồng auth
- `accessToken` gửi trong header `Authorization: Bearer <token>`
- `refreshToken` lưu trong cookie `httpOnly`, dùng endpoint `POST /api/auth/refresh`
- Backend bật `helmet`, `cors` (credentials), rate-limit, sanitize Mongo payload & XSS-clean
- CSRF protection với token rotation & origin validation
- User banning system trong auth middleware

## 1) Cài đặt & chạy backend

### Yêu cầu
- Node.js (khuyến nghị >= 18)
- MongoDB đang chạy (local hoặc remote)

### Cấu hình
1. Copy `ecommerce-backend/.env.example` -> `ecommerce-backend/.env`
2. Điền `MONGO_URI` và các secret JWT
3. (Tùy chọn) cấu hình SMTP để reset password hoạt động

### Chạy
```bash
cd e:\Developer\ecommerce-backend
npm install
npm run dev
```
Backend mặc định chạy ở `http://localhost:3000`.

## 2) Cài đặt & chạy frontend

### Chạy
```bash
cd e:\Developer\ecommerce-backend\frontend
npm install
npm run dev
```
Frontend chạy ở `http://localhost:5173`.

### Cấu hình
- Copy `frontend/.env.example` -> `frontend/.env` (nếu muốn)
- Biến môi trường quan trọng: `VITE_API_BASE_URL=http://localhost:3000`

## 3) Admin user & quyền
- API admin hiện yêu cầu `role=admin`.
- Endpoint register hiện tạo role mặc định `user`.
- Để test admin nhanh:
  - tạo user thường, rồi sửa `role` trong MongoDB thành `admin`, hoặc
  - bổ sung endpoint tạo admin (có thể làm ở bước tiếp theo nếu bạn muốn).

## 4) Upload ảnh & sản phẩm
- Admin upload ảnh: `POST /api/upload/image` (multipart/form-data, field `image`)
- URL trả về có dạng `/uploads/<filename>`, backend serve static từ `/uploads`.

## 5) Các phần đã có
- Auth: register/login/me/logout/refresh, forgot/reset password qua email (backend)
- Frontend đã có trang `forgot-password` và `reset-password` (nhận `token` + `email` từ link email)
- Catalog: categories, products list/search/filter/pagination, product detail
- Reviews: user upsert review, delete own review; admin delete review
- Cart (lưu local nếu chưa login; lưu DB nếu login)
- Checkout: tạo order từ cart + giao hàng + chọn phương thức thanh toán
- Orders: user xem lịch sử; admin cập nhật trạng thái
- Admin dashboard stats: tổng doanh thu / số đơn / số user

## 6) Chạy cùng lúc
Bạn cần mở **2 terminal**:
1. Terminal 1 (backend): `npm run dev` trong `ecommerce-backend`
2. Terminal 2 (frontend): `npm run dev` trong `frontend`

