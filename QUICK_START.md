# Hướng Dẫn Chạy Ứng Dụng - Chi Tiết Từng Bước

## 📋 Mục Lục
1. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
2. [Cài Đặt MongoDB](#cài-đặt-mongodb)
3. [Cấu Hình Backend](#cấu-hình-backend)
4. [Cấu Hình Frontend](#cấu-hình-frontend)
5. [Chạy Ứng Dụng](#chạy-ứng-dụng)
6. [Kiểm Tra Hoạt Động](#kiểm-tra-hoạt-động)
7. [Khắc Phục Lỗi](#khắc-phục-lỗi)

---

## 1. Yêu Cầu Hệ Thống

Đảm bảo bạn có những phần mềm sau **đã cài đặt**:

### Bắt Buộc
- **Node.js** v18+ ([tải từ nodejs.org](https://nodejs.org/))
  - Kiểm tra: `node --version` (phải >= v18.0.0)
  - Kiểm tra npm: `npm --version` (phải >= 9.0.0)

- **MongoDB** (2 cách chọn)
  - **Cách 1**: MongoDB Community Edition (cài trên máy)
  - **Cách 2**: MongoDB Atlas (đám mây, miễn phí)

- **Git** (để clone repo nếu cần)
  - Kiểm tra: `git --version`

### Tùy Chọn Nhưng Được Khuyến Nghị
- **VS Code** - Code editor
- **Postman** hoặc **Bruno** - Test API
- **MongoDB Compass** - GUI để quản lý MongoDB

---

## 2. Cài Đặt MongoDB

### Cách 1️⃣: MongoDB Community Edition (Cài Đặt Trên Máy)

#### Trên Windows

**Bước 1: Tải MongoDB**
1. Vào https://www.mongodb.com/try/download/community
2. Chọn:
   - Platform: Windows
   - Package: MSI
3. Nhấn "Download"

**Bước 2: Cài Đặt**
1. Chạy file `.msi` vừa tải
2. Chọn "Complete" setup
3. Chọn "Run the MongoDB as a Service"
4. Hoàn thành cài đặt

**Bước 3: Xác Nhận**
```bash
# Mở PowerShell và chạy
mongod --version
# Kết quả: sẽ hiện version MongoDB
```

#### Trên macOS

```bash
# Cài đặt với Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Khởi động MongoDB
brew services start mongodb-community

# Kiểm tra
mongosh --version
```

#### Trên Linux (Ubuntu)

```bash
# Cài đặt
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Động MongoDB
sudo systemctl start mongod
```

---

### Cách 2️⃣: MongoDB Atlas (Trên Đám Mây) ⭐ Khuyến Nghị

#### Bước 1: Đăng Ký
1. Vào https://www.mongodb.com/cloud/atlas
2. Nhấn "Try Free"
3. Đăng ký bằng email hoặc Google

#### Bước 2: Tạo Cluster
1. Chọn "Build a Database"
2. Chọn plan "FREE" (Shared)
3. Chọn Cloud Provider (AWS/Google Cloud/Azure)
4. Chọn Region gần bạn nhất (VD: Singapore cho Việt Nam)
5. Nhấn "Create Cluster"
6. Chờ khoảng 3-5 phút...

#### Bước 3: Cấu Hình Kết Nối
1. Sẽ hiển thị "Security Quickstart"
2. **Tạo Database User**:
   - Username: `devuser` 
   - Password: `Dev@12345`
   - Nhấn "Create User"

3. **Thêm IP Address**:
   - Chọn "Allow Access from Anywhere" (0.0.0.0/0)
   - Hoặc thêm IP của bạn
   - Nhấn "Finish"

#### Bước 4: Lấy Connection String
1. Ở dashboard, nhấn "Connect"
2. Chọn "Drivers"
3. Chọn "Node.js"
4. Copy connection string, ví dụ:
   ```
   mongodb+srv://devuser:Dev@12345@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority
   ```

---

## 3. Cấu Hình Backend

### Bước 1: Vào Thư Mục Backend
```bash
cd e:\Developer\ecommerce-backend
# Hoặc
cd /path/to/ecommerce-backend
```

### Bước 2: Cài Đặt Dependencies
```bash
npm install
```
⏳ Quá trình này sẽ mất 1-3 phút

### Bước 3: Tạo File .env
Tạo file `.env` trong thư mục gốc backend:

```bash
# Tạo file .env
touch .env
# Hoặc trên Windows
# new-item -name ".env" -type "file"
```

### Bước 4: Thêm Cấu Hình Vào .env

**Nếu dùng MongoDB Atlas (trên đám mây):**
```bash
NODE_ENV=development
PORT=3000
CLIENT_ORIGIN=http://localhost:5173

# MongoDB Atlas
MONGO_URI=mongodb+srv://devuser:Dev@12345@cluster0.xxxx.mongodb.net/ecommerce?retryWrites=true&w=majority

# JWT Secrets (tạo ra random, ví dụ)
JWT_ACCESS_SECRET=your_random_access_secret_key_12345
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_random_refresh_secret_key_67890
JWT_REFRESH_EXPIRES_IN=7d

# Email (tùy chọn, bỏ qua nếu chưa cần)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM="Ecommerce <no-reply@ecommerce.local>"

# Momo Payment (tùy chọn, dùng sau khi đăng ký Momo)
MOMO_PARTNER_CODE=MOMOXXXXXXXX
MOMO_ACCESS_KEY=XXXXXXXXXXXXXXXX
MOMO_SECRET_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
MOMO_STORE_ID=MomoStore
MOMO_WEBHOOK_URL=https://yourdomain.com/api/payments/momo/webhook
```

**Hoặc nếu dùng MongoDB Local (trên máy):**
```bash
NODE_ENV=development
PORT=3000
CLIENT_ORIGIN=http://localhost:5173

# MongoDB Local
MONGO_URI=mongodb://127.0.0.1:27017/ecommerce

# JWT Secrets
JWT_ACCESS_SECRET=your_random_access_secret_key_12345
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_random_refresh_secret_key_67890
JWT_REFRESH_EXPIRES_IN=7d

# Email (tùy chọn)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM="Ecommerce <no-reply@ecommerce.local>"

# Momo Payment (tùy chọn)
MOMO_PARTNER_CODE=MOMOXXXXXXXX
MOMO_ACCESS_KEY=XXXXXXXXXXXXXXXX
MOMO_SECRET_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
MOMO_STORE_ID=MomoStore
MOMO_WEBHOOK_URL=https://yourdomain.com/api/payments/momo/webhook
```

### Bước 5: Generte JWT Secret (tùy chọn nhưng tốt hơn)
```bash
# Tạo random string an toàn
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Chạy lệnh này 2 lần, lấy kết quả thay vào `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET`

### ⚠️ Lưu Ý Quan Trọng
- **Không share file `.env`** công khai
- Thêm `.env` vào `.gitignore` (nếu dùng Git)
- Kiểm tra lại kôi kết nối MongoDB

---

## 4. Cấu Hình Frontend

### Bước 1: Vào Thư Mục Frontend
```bash
cd e:\Developer\ecommerce-backend\frontend
# Hoặc
cd /path/to/ecommerce-backend/frontend
```

### Bước 2: Cài Đặt Dependencies
```bash
npm install
```

### Bước 3: Tạo File .env
```bash
# Tạo file .env
touch .env
# Hoặc trên Windows
# new-item -name ".env" -type "file"
```

### Bước 4: Thêm Cấu Hình
```bash
VITE_API_BASE_URL=http://localhost:3000
```

---

## 5. Chạy Ứng Dụng

### 🟢 Bước 1: Khởi Động MongoDB (nếu dùng Local)

**Trên Windows (PowerShell):**
```bash
# MongoDB sẽ tự chạy nếu được cài như Service
# Hoặc chạy thủ công:
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
```

**Trên macOS/Linux:**
```bash
mongod
# Hoặc nếu dùng Homebrew:
brew services start mongodb-community
```

### 🔵 Bước 2: Chạy Backend

**Terminal 1 (giữ mở)**
```bash
cd e:\Developer\ecommerce-backend
npm run dev
```

✅ Khi thấy:
```
API running at http://localhost:3000
```
Backend đã chạy thành công!

### 🟡 Bước 3: Chạy Frontend

**Terminal 2 (giữ mở)**
```bash
cd e:\Developer\ecommerce-backend\frontend
npm run dev
```

✅ Khi thấy:
```
VITE v8.0.1  ready in 1234 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```
Frontend đã chạy thành công!

---

## 6. Kiểm Tra Hoạt Động

### Bước 1: Mở Trình Duyệt
```
http://localhost:5173
```

### Bước 2: Kiểm Tra Trang Chủ
- [ ] Trang tải được (không lỗi 404)
- [ ] Có thể thấy sản phẩm
- [ ] Có thể thấy danh mục

### Bước 3: Kiểm Tra API (Postman/Bruno)

**Test 1: Health Check**
```
GET http://localhost:3000/api/health

Response mong đợi:
{
  "ok": true,
  "service": "ecommerce-api"
}
```

**Test 2: Đăng Ký**
```
POST http://localhost:3000/api/auth/register

Body:
{
  "email": "test@example.com",
  "password": "Test@1234",
  "name": "Test User"
}

Response mong đợi:
{
  "user": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test User",
    "role": "user"
  },
  "accessToken": "..."
}
```

**Test 3: Đăng Nhập**
```
POST http://localhost:3000/api/auth/login

Body:
{
  "email": "test@example.com",
  "password": "Test@1234"
}

Response:
{
  "user": { ... },
  "accessToken": "..."
}
```

### Bước 4: Kiểm Tra MongoDB

**Nếu dùng MongoDB Local:**
```bash
# Mở terminal mới
mongosh

# Trong MongoDB shell
use ecommerce
db.users.find()  # Sẽ thấy user vừa tạo
```

**Nếu dùng MongoDB Atlas:**
1. Vào https://cloud.mongodb.com
2. Vào "Database" → "Browse Collections"
3. Xem dữ liệu tại `ecommerce.users`

---

## 7. URL Quan Trọng

| Tên | URL | Mô Tả |
|-----|-----|-------|
| Frontend | http://localhost:5173 | Ứng dụng giao diện người dùng |
| Backend API | http://localhost:3000 | API server |
| Health Check | http://localhost:3000/api/health | Kiểm tra backend hoạt động |
| MongoDB Local | mongodb://127.0.0.1:27017 | Kết nối MongoDB local |
| MongoDB Compass | mongodb://127.0.0.1:27017 | Giao diện quản lý MongoDB |

---

## 8. Các Câu Lệnh Hữu Ích

### Backend
```bash
cd ecommerce-backend

# Phát triển (auto reload khi thay đổi file)
npm run dev

# Chạy production
npm start

# Kiểm tra syntax
node -c src/app.js

# Cài package mới
npm install package_name
```

### Frontend
```bash
cd ecommerce-backend/frontend

# Phát triển (hot reload)
npm run dev

# Build cho production
npm run build

# Xem build
npm run preview

# Cài package mới
npm install package_name
```

### MongoDB
```bash
# Kết nối MongoDB local
mongosh

# Các lệnh trong MongoDB shell
use ecommerce              # Chọn database
db.users.find()            # Xem all users
db.products.find()         # Xem all products
db.users.findOne({email: "test@example.com"})  # Tìm user
db.users.deleteMany({})    # Xóa all users (cẩn thận!)
```

---

## 9. Khắc Phục Lỗi

### ❌ Lỗi: "Cannot find module"

**Nguyên nhân:** Dependencies chưa cài đặt

**Giải pháp:**
```bash
# Xóa node_modules
rm -r node_modules
# Hoặc trên Windows: rmdir /s /q node_modules

# Cài lại
npm install
```

---

### ❌ Lỗi: "Port 3000 already in use"

**Nguyên nhân:** Cổng 3000 đang bị chiếm dụng

**Giải pháp 1: Dừng chương trình khác**
```bash
# Trên Windows
netstat -ano | findstr :3000
# Ghi nhớ PID (cột cuối), rồi
taskkill /PID <PID> /F

# Trên macOS/Linux
lsof -i :3000
kill -9 <PID>
```

**Giải pháp 2: Dùng port khác**
```bash
# Trong .env, đổi:
PORT=3001
```

---

### ❌ Lỗi: "Cannot connect to MongoDB"

**Nguyên nhân:** MongoDB chưa chạy hoặc connection string sai

**Giải pháp:**

1. **Kiểm tra MongoDB chạy chưa:**
```bash
# Trên Windows
tasklist | findstr mongod

# Trên macOS
brew services list

# Trên Linux
systemctl status mongod
```

2. **Nếu chưa chạy, khởi động:**
Windows:
```bash
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
```

macOS/Linux:
```bash
brew services start mongodb-community
# hoặc
sudo systemctl start mongod
```

3. **Kiểm tra kết nối string trong .env:**
- Local: `mongodb://127.0.0.1:27017/ecommerce`
- Atlas: `mongodb+srv://devuser:password@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority`

---

### ❌ Lỗi: "ERR_MODULE_NOT_FOUND"

**Nguyên nhân:** File .env chưa được tạo

**Giải pháp:**
```bash
# Tạo file .env trong backend folder
cd ecommerce-backend
touch .env  # macOS/Linux
# Hoặc trên Windows:
# new-item .env
```

---

### ❌ Frontend không kết nối được API

**Nguyên nhân:** `VITE_API_BASE_URL` sai hoặc Backend chưa chạy

**Giải pháp:**

1. **Kiểm tra backend đang chạy:**
```bash
curl http://localhost:3000/api/health
```

2. **Kiểm tra frontend `.env`:**
```bash
# Phải là:
VITE_API_BASE_URL=http://localhost:3000
```

3. **Restart frontend:**
```bash
# Dừng terminal frontend (Ctrl+C)
# Chạy lại:
npm run dev
```

---

### ❌ Lỗi: "ENOENT: no such file or directory"

**Nguyên nhân:** npm install chưa chạy

**Giải pháp:**
```bash
cd ecommerce-backend  # hoặc frontend
npm install
```

---

### ❌ Lỗi: TypeError: Cannot read property 'MONGO_URI'

**Nguyên nhân:** Biến môi trường chưa được load

**Giải pháp:**

1. Kiểm tra file `.env` có tồn tại trong `ecommerce-backend/`
2. Kiểm tra `MONGO_URI` đã có giá trị
3. Restart backend: `npm run dev`

---

## 10. Các Tính Năng Để Test

### 👤 Quản Lý Tài Khoản
- [x] Đăng ký tài khoản mới
- [x] Đăng nhập
- [x] Xem thông tin cá nhân
- [x] Cập nhật thông tin
- [x] Quên mật khẩu / Reset mật khẩu

### 🛍️ Quản Lý Sản Phẩm
- [x] Xem danh sách sản phẩm
- [x] Tìm kiếm sản phẩm
- [x] Lọc theo danh mục
- [x] Lọc theo giá
- [x] Xem chi tiết sản phẩm
- [x] Xem đánh giá

### 🛒 Giỏ Hàng
- [x] Thêm vào giỏ
- [x] Xem giỏ hàng
- [x] Cập nhật số lượng
- [x] Xóa khỏi giỏ
- [x] Xóa toàn bộ giỏ

### 📦 Đơn Hàng
- [x] Tạo đơn hàng
- [x] Xem lịch sử đơn hàng
- [x] Xem chi tiết đơn hàng

### 💳 Thanh Toán Momo
- [x] Tạo đơn hàng với thanh toán Momo
- [x] Redirect tới Momo
- [x] Xử lý callback từ Momo
- [x] Cập nhật trạng thái thanh toán

### 👨‍💼 Admin Dashboard
- [x] Xem thống kê
- [x] Quản lý danh mục
- [x] Tạo sản phẩm
- [x] Upload nhiều ảnh
- [x] Quản lý người dùng
- [x] Ban/Unban người dùng
- [x] Thay đổi vai trò admin

---

## 11. Tips Hữu Ích

### 🎯 Chạy cùng lúc trên 1 Terminal
```bash
# Windows (PowerShell)
$mongod = Start-Process mongod -PassThru
# Chạy backend ở terminal khác...
# Chạy frontend ở terminal khác...

# macOS/Linux
mongod &
cd ecommerce-backend && npm run dev &
cd ecommerce-backend/frontend && npm run dev &
```

### 🔄 Làm sạch dữ liệu
```bash
# Trong MongoDB shell
db.dropDatabase()  # Xóa toàn bộ database
use ecommerce      # Tạo lại
```

### 📊 Xem logs chi tiết
```bash
# Backend sẽ in ra logs
# Nếu muốn debug hơn:
# Mở DevTools: F12 → Console (trong trình duyệt)
# Backend logs hiển thị ở terminal
```

### 🚀 Deploy (tương lai)
1. **Backend:** Heroku, Railway, Render
2. **Frontend:** Vercel, Netlify, GitHub Pages
3. **Database:** MongoDB Atlas (miễn phí)

---

## 12. Hỗ Trợ & Tài Liệu

| Nội Dung | Link |
|----------|------|
| Node.js Docs | https://nodejs.org/docs/ |
| Express Docs | https://expressjs.com/ |
| MongoDB Docs | https://docs.mongodb.com/ |
| React Docs | https://react.dev/ |
| Vite Docs | https://vitejs.dev/ |

---

## 📝 Checklist Hoàn Thành

- [ ] Cài đặt Node.js v18+
- [ ] Cài đặt MongoDB
- [ ] Cấu hình file `.env` backend
- [ ] Cấu hình file `.env` frontend
- [ ] Chạy `npm install` ở cả backend và frontend
- [ ] Khởi động MongoDB
- [ ] Chạy Backend: `npm run dev`
- [ ] Chạy Frontend: `npm run dev`
- [ ] Mở http://localhost:5173
- [ ] Test tính năng cơ bản
- [ ] Đăng ký tài khoản mới
- [ ] Đăng nhập
- [ ] Duyệt sản phẩm
- [ ] Thêm vào giỏ hàng
- [ ] Tạo đơn hàng

Khi hoàn thành tất cả ✅ thì ứng dụng đã sẵn sàng!

---

## 🎉 Chúc Mừng!

Bạn đã thiết lập xong toàn bộ ứng dụng! Giờ có thể:
- Phát triển thêm tính năng mới
- Deploy lên production
- Chia sẻ với bạn bè
- Tạo portfolio project

**Nếu gặp vấn đề, kiểm tra lại:**
1. Terminal để xem error messages
2. File `.env` để xác nhận cấu hình
3. MongoDB đang chạy không
4. Cổng 3000 và 5173 không bị chiếm dụng

---

**Chúc bạn thành công! 🚀**
