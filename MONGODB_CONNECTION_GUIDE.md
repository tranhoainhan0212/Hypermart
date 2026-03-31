# 📦 Hướng Dẫn Kết Nối MongoDB

## 🎯 2 Cách Kết Nối MongoDB

---

## 🟡 **Option 1: MongoDB Local (Cài Trên Máy)** ⚡ Nhanh

### Step-by-step cho Windows

#### ✅ Bước 1: Tải & Cài MongoDB
1. Vào https://www.mongodb.com/try/download/community
2. Tải **Windows MSI Installer**
3. Chạy file `.msi` → Chọn **Complete Setup**
4. ✔️ Tick "Run the MongoDB as a Service"
5. Hoàn thành cài đặt

#### ✅ Bước 2: Kiểm Tra MongoDB Đã Chạy
```PowerShell
# Mở PowerShell/CMD và chạy
mongod --version
# Kết quả: MongoDB shell version v7.0.0 (hoặc version khác)

# Cửa sổ MongoDB Service đã chạy tự động ở background
```

#### ✅ Bước 3: Tạo Database (Optional)
```bash
# Mở mongosh
mongosh

# Trong mongosh shell
use ecommerce         # Tạo database "ecommerce"
db.users.insertOne({name: "Test"})  # Insert test data
db.users.find()       # Xem dữ liệu

# Thoát mongosh
exit
```

#### ✅ Bước 4: Cấu Hình .env (Backend)
Tạo file `.env` trong thư mục `e:\Developer\ecommerce-backend`:

```env
NODE_ENV=development
PORT=3000
CLIENT_ORIGIN=http://localhost:5173

# MongoDB Local Connection
MONGO_URI=mongodb://127.0.0.1:27017/ecommerce

# JWT Secrets (tạo random)
JWT_ACCESS_SECRET=your_random_access_secret_key_here_12345
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_random_refresh_secret_key_here_67890
JWT_REFRESH_EXPIRES_IN=7d

# Email (skip nếu chưa cần)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Momo Payment (skip if not needed)
MOMO_PARTNER_CODE=MOMOXXXXXXXX
MOMO_ACCESS_KEY=test
MOMO_SECRET_KEY=test
MOMO_STORE_ID=MomoStore
```

#### ✅ Bước 5: Kiểm Tra Kết Nối
```bash
cd e:\Developer\ecommerce-backend

# Cài dependencies
npm install

# Chạy backend
npm run dev
```

Nếu thấy dòng này trong terminal:
```
✅ Server running on port 3000
✅ Connected to MongoDB
```
→ **Thành công! ✨**

---

## 🔵 **Option 2: MongoDB Atlas (Cloud)** ☁️ Khuyến Nghị

### Ưu điểm
- ✅ Không cần cài đặt trên máy
- ✅ Miễn phí với giới hạn nhỏ (512 MB - đủ để test)
- ✅ Dùng được từ mọi nơi
- ✅ Tự động backup & bảo mật

### ⏱️ Setup mất khoảng 10 phút

#### ✅ Bước 1: Đăng Ký Atlas
1. Vào https://www.mongodb.com/cloud/atlas
2. Nhấn **"Try for free"**
3. Đăng ký bằng **email** hoặc **Google**

#### ✅ Bước 2: Tạo Cluster (Database)
1. Nhấn **"Create a Database"**
2. Chọn **FREE** tier (Shared)
3. Cloud Provider: **AWS** (hoặc Google Cloud)
4. Region: **Singapore** hoặc **Tokyo** (gần Việt Nam)
5. Nhấn **"Create Cluster"** (chờ 3-5 phút)

#### ✅ Bước 3: Cấu Hình Security
1. Chọn tab **"Security Quickstart"**

**3a. Tạo Database User:**
- Username: `devuser`
- Password: `Dev@12345`
- Nhấn **"Create User"** ✓

**3b. Whitelist IP Address:**
- Chọn **"My Local Environment"**
- Hoặc nhấn **"Add My Current IP Address"**
- Hoặc chọn **"0.0.0.0/0"** (Allow từ mọi nơi - cho development)
- Nhấn **"Finish"** ✓

#### ✅ Bước 4: Lấy Connection String

**Cách 1: Dashboard**
1. Nhấn nút **"Connect"**
2. Chọn **"Drivers"**
3. Chọn **Node.js**
4. Copy connection string

**Cách 2: Connection String từ Atlas**
```
mongodb+srv://devuser:Dev@12345@cluster0.xxxxx.mongodb.net/ecommerce?retryWrites=true&w=majority
```
(Thay `xxxxx` bằng cluster ID của bạn)

#### ✅ Bước 5: Cấu Hình .env (Backend)

Tạo file `.env` trong `e:\Developer\ecommerce-backend`:

```env
NODE_ENV=development
PORT=3000
CLIENT_ORIGIN=http://localhost:5173

# MongoDB Atlas Connection
MONGO_URI=mongodb+srv://devuser:Dev@12345@cluster0.xxxxx.mongodb.net/ecommerce?retryWrites=true&w=majority

# JWT Secrets
JWT_ACCESS_SECRET=your_random_access_secret_key_here_12345
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_random_refresh_secret_key_here_67890
JWT_REFRESH_EXPIRES_IN=7d

# Email (skip nếu chưa cần)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Momo Payment (skip nếu chưa cần)
MOMO_PARTNER_CODE=MOMOXXXXXXXX
MOMO_ACCESS_KEY=test
MOMO_SECRET_KEY=test
MOMO_STORE_ID=MomoStore
```

#### ✅ Bước 6: Kiểm Tra Kết Nối
```bash
cd e:\Developer\ecommerce-backend

npm install

npm run dev
```

Nếu thấy:
```
✅ Server running on port 3000
✅ Connected to MongoDB
```
→ **Thành công! ✨**

---

## 🔍 Cách Kiểm Tra Kết Nối MongoDB

### Từ Terminal
```bash
# Test kết nối MongoDB local
mongosh

# Test kết nối MongoDB Atlas
mongosh "mongodb+srv://devuser:Dev@12345@cluster0.xxxxx.mongodb.net/"
```

### Từ Backend Log
Chạy backend:
```bash
npm run dev
```

Nếu kết nối thành công, sẽ thấy:
```
Server running on port 3000 ✓
Connected to MongoDB ✓
```

### Từ MongoDB Compass (GUI)
1. Tải [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Nhập connection string
3. Nhấn "Connect"
4. Xem databases, collections, documents

---

## 🚨 Lỗi Thường Gặp & Cách Khắc Phục

### ❌ "MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017"
**Nguyên nhân**: MongoDB local không chạy
**Cách khắc phục**:
```bash
# Windows: Kiểm tra MongoDB Service
mongod --version

# Hoặc khởi động lại MongoDB Service trong Services
# hoặc chạy MongoDB từ terminal
mongod
```

### ❌ "MongoAuthenticationError: authentication failed"
**Nguyên nhân**: Username/password sai ở .env
**Cách khắc phục**:
1. Kiểm tra lại username/password ở MongoDB Atlas
2. Kiểm tra MONGO_URI có chứa `+srv` đúng hay không
3. Nếu có ký tự đặc biệt, phải encode: `@` → `%40`, `:` → `%3A`

### ❌ "MongoParseError: invalid connection string"
**Nguyên nhân**: Connection string format sai
**Cách khắc phục**:
- MongoDB Local: `mongodb://127.0.0.1:27017/ecommerce`
- MongoDB Atlas: `mongodb+srv://username:password@cluster.xxxxx.mongodb.net/ecommerce?retryWrites=true&w=majority`

### ❌ "CORS error" hoặc "Connection timeout"
**Nguyên nhân**: IP không được whitelist ở MongoDB Atlas
**Cách khắc phục**:
1. Vào MongoDB Atlas Dashboard
2. Network Access → IP Whitelist
3. Thêm IP của bạn hoặc chọn `0.0.0.0/0`

### ❌ "getaddrinfo ENOTFOUND cluster0.xxxxx.mongodb.net"
**Nguyên nhân**: Internet connection problem hoặc cluster không tồn tại
**Cách khắc phục**:
1. Kiểm tra internet
2. Copy lại connection string từ Atlas
3. Kiểm tra cluster name chính xác

---

## ✅ Checklist: MongoDB Connection

- [ ] MongoDB cài đặt (Local hoặc Atlas account)
- [ ] Username/password được tạo
- [ ] IP được whitelist (nếu Atlas)
- [ ] Connection string được copy chính xác
- [ ] File `.env` được tạo dengan MONGO_URI
- [ ] Backend dependencies được cài (`npm install`)
- [ ] Backend có thể chạy (`npm run dev`)
- [ ] Thấy log "Connected to MongoDB ✓"

---

## 🎯 Bước Tiếp Theo

Sau khi kết nối MongoDB thành công:

1. **Chạy Backend**
   ```bash
   npm run dev
   ```

2. **Chạy Frontend** (terminal khác)
   ```bash
   cd frontend
   npm run dev
   ```

3. **Truy cập**: http://localhost:5173

4. **Test tính năng**:
   - Đăng ký tài khoản: http://localhost:5173/register
   - Đăng nhập: http://localhost:5173/login
   - Xem sản phẩm: http://localhost:5173

---

## 📚 Tài Liệu Thêm

- **QUICK_START.md** - Hướng dẫn chi tiết đầy đủ
- **ARCHITECTURE.md** - Kiến trúc hệ thống
- **.env.example** - Ví dụ .env configuration
- **docs/DB_SCHEMA.md** - Cấu trúc database

---

## 💡 Tips

✅ **Dùng MongoDB Atlas cho development** - dễ hơn, không cần cài
✅ **Dùng MongoDB Local cho production** - nhanh hơn, không phụ thuộc internet
✅ **Luôn check logs khi chạy backend** - giúp debug nhanh hơn
✅ **Dùng MongoDB Compass** - dễ hình dung dữ liệu
✅ **Bảo vệ password ở .env** - không commit vào Git

---

**Bạn đã sẵn sàng kết nối MongoDB! 🎉**

Hỏi nếu gặp lỗi!
