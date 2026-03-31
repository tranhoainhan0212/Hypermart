# Sơ Đồ & Tham Chiếu Nhanh

## 🏗️ Kiến Trúc Ứng Dụng

```
┌─────────────────────────────────────────────────────────────────┐
│                        TRÌNH DUYỆT                              │
│                  (Frontend - React + Vite)                      │
│                  http://localhost:5173                          │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP/HTTPS Requests
                     │ (API calls via Axios)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API                                  │
│              (Express.js + Node.js)                             │
│           http://localhost:3000/api/*                           │
│                                                                 │
│  Middleware Stack:                                              │
│  ├─ CORS & Security (helmet, xss-clean)                        │
│  ├─ Authentication (JWT)                                        │
│  ├─ CSRF Protection                                             │
│  ├─ Origin Validation                                           │
│  └─ Error Handling                                              │
└────────────┬─────────────────────────────────┬──────────────────┘
             │                                 │
             ▼                                 ▼
       ┌──────────────┐             ┌─────────────────────┐
       │  MONGODB     │             │   MOMO PAYMENT      │
       │  DATABASE    │             │   GATEWAY           │
       │              │             │                     │
       │ - Users      │             │ - Process Payments  │
       │ - Products   │             │ - Webhooks          │
       │ - Orders     │             │ - Transaction Info  │
       │ - Reviews    │             │                     │
       │ - Categories │             │ momo.vn             │
       └──────────────┘             └─────────────────────┘
```

---

## 📂 Cấu Trúc Thư Mục

```
ecommerce-backend/
│
├── frontend/                    # React Frontend
│   ├── src/
│   │   ├── pages/              # Trang (HomePage, LoginPage, etc)
│   │   ├── components/         # Components tái sử dụng
│   │   ├── services/           # API calls
│   │   ├── redux/              # State management
│   │   ├── hooks/              # Custom hooks
│   │   └── styles/             # CSS/Tailwind
│   ├── package.json
│   ├── .env                    # Frontend config
│   └── vite.config.ts
│
├── src/                        # Express Backend
│   ├── controllers/            # Business logic
│   │   ├── auth.controller.js
│   │   ├── product.controller.js
│   │   ├── admin.controller.js
│   │   └── payment.controller.js
│   ├── models/                 # MongoDB schemas
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   └── Review.js
│   ├── routes/                 # API routes
│   │   ├── auth.routes.js
│   │   ├── product.routes.js
│   │   ├── admin.routes.js
│   │   └── payment.routes.js
│   ├── services/               # External services
│   │   ├── momo.js             # Momo API
│   │   └── email.js            # Email service
│   ├── middlewares/            # Express middlewares
│   │   ├── auth.js             # JWT auth
│   │   ├── csrf.js             # CSRF protection
│   │   ├── error.js            # Error handling
│   │   └── validate.js         # Input validation
│   ├── utils/                  # Utilities
│   │   ├── jwt.js
│   │   ├── slugify.js
│   │   └── httpError.js
│   ├── config/                 # Configuration
│   │   └── db.js               # MongoDB connection
│   ├── app.js                  # Express app setup
│   └── server.js               # Server entry point
│
├── docs/                       # Documentation
│   ├── API.md
│   └── DB_SCHEMA.md
│
├── .env                        # Environment variables (KHÔNG share)
├── .env.example                # Template (OK to share)
├── QUICK_START.md              # Hướng dẫn nhanh
├── IMPLEMENTATION_GUIDE.md     # Hướng dẫn chi tiết
├── ENV_SETUP.md                # Cấu hình môi trường
├── package.json
└── README.md
```

---

## 🔄 Quy Trình Đăng Ký & Đăng Nhập

```
┌─────────────┐
│   Người dùng│
└──────┬──────┘
       │
       │ 1. Nhập email/password
       ▼
┌──────────────────────────┐
│ Frontend (Register Page) │
└──────┬───────────────────┘
       │
       │ 2. POST /api/auth/register
       ▼
┌──────────────────────────┐
│  Backend (auth.routes)   │
└──────┬───────────────────┘
       │
       │ 3. Validate input (Zod)
       ▼
┌──────────────────────────┐
│ authController.register  │
└──────┬───────────────────┘
       │
       │ 4. Hash password (bcrypt)
       ▼
┌──────────────────────────┐
│   MongoDB (User.create)  │
└──────┬───────────────────┘
       │
       │ 5. Tạo JWT token
       ▼
┌──────────────────────────┐
│  Return user + token     │
└──────┬───────────────────┘
       │
       │ 6. Store token (localStorage)
       ▼
┌────────────────┐
│  HomePage/Đăng nhập
│    thành công!   │
└────────────────┘
```

---

## 🛒 Quy Trình Đặt Hàng & Thanh Toán Momo

```
┌─────────┐
│  Giỏ    │ (1. User thêm items vào giỏ)
└────┬────┘
     │
     │ (2. Click Checkout)
     ▼
┌────────────────────┐
│  Checkout Page     │ (Nhập địa chỉ, chọn thanh toán)
└────┬───────────────┘
     │
     │ (3. POST /api/orders) ← Select MOMO payment
     ▼
┌────────────────────┐
│  Order Controller  │ (Tạo order, trừ stock)
└────┬───────────────┘
     │
     │ (4. Redirect to /orders/{orderId}/payment)
     ▼
┌───────────────────────┐
│  Momo Payment Page    │
└────┬──────────────────┘
     │
     │ (5. Click "Pay Now")
     │
     │ (6. POST /api/payments/momo/initiate)
     ▼
┌────────────────────┐
│  Payment Controller│ (Tạo Momo payment request)
└────┬───────────────┘
     │
     │ (7. Call Momo API)
     ▼
┌────────────────────┐
│   MOMO SERVER      │ (Tạo payment URL)
└────┬───────────────┘
     │
     │ (payUrl returned)
     ▼
┌────────────────────┐
│ Redirect to MOMO   │ (User thanh toán trên MOMO)
│ Payment Page       │
└────┬───────────────┘
     │
     │ (User hoàn thành thanh toán trên MOMO)
     │
     │ (8. MOMO gửi POST webhook đến backend)
     ▼
┌────────────────────────────┐
│  POST /api/payments/momo/  │
│       webhook              │
└────┬───────────────────────┘
     │
     │ (9. Verify signature)
     └──► (10. Update Order status → PAID/CONFIRMED)
     │
     └──► (11. Send response: 200 OK)
     
     
┌──────────────────────────────┐
│ (12. User redirected back to │
│    Order Details Page)        │ ✅ Payment success!
└──────────────────────────────┘
```

---

## 🔐 Quy Trình Authentication & CSRF

```
┌─────────────────────────────────────────────────┐
│  Backend Authentication Flow                    │
└─────────────────────────────────────────────────┘

1️⃣ LOGIN
   Client POST /api/auth/login
   ↓
   Server: Hash password check + JWT generation
   ↓
   Response: accessToken (localStorage) + refreshToken (httpOnly cookie)

2️⃣ AUTHENTICATED REQUESTS
   Client: Authorization header: "Bearer {accessToken}"
   ↓
   Server: requireAuth middleware → verify JWT
   ↓
   Server: Check if user isBanned
   ↓
   If valid: Allow request, attach user to req.user
   If invalid/expired: Return 401

3️⃣ TOKEN REFRESH
   Client: POST /api/auth/refresh
   ↓
   Server: Check refreshToken cookie
   ↓
   Server: Generate new accessToken + NEW CSRF token
   ↓
   Response: New accessToken (+ rotated CSRF token)

4️⃣ CSRF PROTECTION (State-changing requests)
   For every POST/PUT/DELETE:
   ├─ Client sends: X-CSRF-Token header (from cookie)
   ├─ Server: checkOrigin middleware → validate Origin
   ├─ Server: requireCsrf middleware → verify token match
   └─ If invalid: 403 Forbidden

5️⃣ LOGOUT
   Client: POST /api/auth/logout
   ↓
   Server: Clear refreshToken cookie + CSRF cookie
   ↓
   Client: Clear accessToken from localStorage
```

---

## 📊 Database Schema Tóm Tắt

```
┌──────────────┐
│    Users     │
├──────────────┤
│ _id          │
│ email        │ ← unique
│ passwordHash │
│ name         │
│ role         │ (user | admin)
│ isBanned     │ ← ban/unban
│ bannedAt     │
│ cart: [      │
│   {          │
│     product  │ → ref Product
│     quantity │
│   }          │
│ ]            │
│ createdAt    │
└──────────────┘

┌──────────────┐
│   Products   │
├──────────────┤
│ _id          │
│ name         │
│ slug         │ (unique URL-friendly)
│ description  │
│ images: [    │ (multiple images!)
│   {          │
│     url      │
│     alt      │
│     order    │
│     isPrimary│
│   }          │
│ ]            │
│ price        │
│ stock        │
│ category     │ → ref Category
│ ratingAvgr   │
│ ratingCount  │
│ createdAt    │
└──────────────┘

┌──────────────┐
│    Orders    │
├──────────────┤
│ _id          │
│ user         │ → ref User
│ items: [     │
│   {          │
│     product  │ → ref Product
│     name     │
│     price    │
│     quantity │
│   }          │
│ ]            │
│ shippingAddr │
│ paymentMethod│(COD|MOMO|PAYPAL)
│ paymentStatus│ (unpaid|paid)
│ momoTransId  │ ← Momo tracking
│ order Status │(pending|confirmed|...)
│ total        │
│ createdAt    │
└──────────────┘
```

---

## 🛠️ Công Cụ & Commands

| Công Cụ | Lệnh | Mục Đích |
|---------|------|---------|
| **Node.js** | `node -v` | Kiểm tra version |
| **npm** | `npm -v` | Kiểm tra npm |
| **MongoDB** | `mongod` | Khởi động server |
| **MongoDB Shell** | `mongosh` | Kết nối DB |
| **Backend Dev** | `npm run dev` | Start with auto-reload |
| **Frontend Dev** | `npm run dev` | Start dev server |
| **Frontend Build** | `npm run build` | Build production |
| **Syntax Check** | `node -c file.js` | Kiểm tra syntax JS |

---

## 🌐 API Endpoints Tóm Tắt

### Auth
```
POST   /api/auth/register       - Đăng ký
POST   /api/auth/login          - Đăng nhập  
POST   /api/auth/refresh        - Refresh token
POST   /api/auth/logout         - Đăng xuất
GET    /api/auth/me             - Thông tin cá nhân
PUT    /api/auth/me             - Cập nhật thông tin
POST   /api/auth/forgot-password - Quên mật khẩu
POST   /api/auth/reset-password  - Reset mật khẩu
```

### Products
```
GET    /api/products            - Danh sách (search, filter, sort)
GET    /api/products/:id        - Chi tiết sản phẩm
POST   /api/products            - Tạo (Admin)
PUT    /api/products/:id        - Cập nhật (Admin)
DELETE /api/products/:id        - Xóa (Admin)
```

### Cart
```
GET    /api/cart/me             - Xem giỏ hàng
PUT    /api/cart/me             - Cập nhật giỏ
DELETE /api/cart/me             - Xóa giỏ
```

### Orders
```
POST   /api/orders              - Tạo đơn hàng
GET    /api/orders/me           - Lịch sử đơn
GET    /api/orders/me/:id       - Chi tiết đơn
```

### Payments
```
POST   /api/payments/momo/initiate   - Bắt đầu thanh toán Momo
POST   /api/payments/momo/webhook    - Webhook from Momo
GET    /api/payments/:orderId/status - Kiểm tra trạng thái
```

### Admin
```
GET    /api/admin/dashboard          - Thống kê
GET    /api/admin/users              - Danh sách users
PUT    /api/admin/users/:id/ban      - Ban user
PUT    /api/admin/users/:id/unban    - Unban user
PUT    /api/admin/users/:id/role     - Đổi role
DELETE /api/admin/users/:id          - Xóa user
```

---

## 📱 Quy Trình Admin Dashboard

```
┌────────────────────────────────────────┐
│    Admin Dashboard (Tab Navigation)    │
└────────────────────────────────────────┘
       │
       ├─► Dashboard Tab
       │   ├─ Tổng Revenue
       │   ├─ Tổng Orders
       │   └─ Tổng Users
       │
       ├─► Products Tab
       │   ├─ Quản lý Categories
       │   └─ Tạo Product
       │       ├─ Nhập thông tin
       │       ├─ Upload multiple images
       │       ├─ Reorder images (↑↓)
       │       ├─ Set primary image
       │       └─ Save → API POST
       │
       ├─► Users Tab
       │   ├─ Search by email/name
       │   ├─ Filter by role
       │   └─ Actions per user:
       │       ├─ Change role
       │       ├─ Ban/Unban
       │       └─ Delete
       │
       └─► Orders Tab
           ├─ Xem tất cả orders
           ├─ Trạng thái payment
           └─ Trạng thái order
```

---

## 📋 Testing Checklist

```
□ Frontend tải được
□ API health check OK (GET /api/health)
□ Đăng ký tài khoản mới
□ Đăng nhập thành công
□ Xem danh sách sản phẩm
□ Xem chi tiết sản phẩm
□ Thêm vào giỏ hàng
□ Xem giỏ hàng
□ Tạo đơn hàng
□ Xem lịch sử đơn hàng
□ Admin: Xem dashboard
□ Admin: Tạo sản phẩm (với hình ảnh)
□ Admin: Quản lý users
□ Payment: Momo payment flow (nếu setup)
```

---

## 🚀 Quick Terminal Commands

```bash
# === Backend ===
cd ecommerce-backend
npm install              # Cài dependencies
npm run dev              # Chạy phát triển
npm audit                # Kiểm tra security

# === Frontend ===
cd ecommerce-backend/frontend
npm install              # Cài dependencies
npm run dev              # Chạy dev server
npm run build            # Build production
npm run preview          # Xem build

# === MongoDB ===
mongosh
use ecommerce            # Chọn database
db.users.find()          # Xem users
db.products.find()       # Xem products
db.users.deleteMany({})  # Xóa tất cả users (cẩn thận!)

# === Utility ===
# Tạo random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Kiểm tra port đang dùng
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # macOS/Linux
```

---

## 🔗 Important Links

| Link | Mục Đích |
|------|---------|
| http://localhost:5173 | Frontend |
| http://localhost:3000 | Backend |
| http://localhost:3000/api/health | Health check |
| https://www.mongodb.com | MongoDB |
| https://business.momo.vn | Momo Payment |
| https://www.postman.com | API Testing |

---

## 💡 Ghi Chú Quan Trọng

✅ **Do:**
- Store JWT token trong localStorage
- Gửi JWT trong Authorization header: `Bearer {token}`
- Reload page không mất state (Redux)
- Validate input ở Frontend & Backend
- Kiểm tra CORS settings

❌ **Avoid:**
- Lưu JWT trong cookies (window accessible)
- Gửi password qua HTTP (phải HTTPS)
- Store sensitive data ở localStorage
- Để credentials trong version control
- Commit file `.env`

---

**Good Luck! 🎉**
