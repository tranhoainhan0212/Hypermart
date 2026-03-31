# 🔐 Hướng dẫn đăng nhập Google & Facebook

## 📋 Mục lục
1. [Lấy Google API Keys](#🔍-lấy-google-api-keys)
2. [Lấy Facebook API Keys](#🔍-lấy-facebook-api-keys)
3. [Cấu hình .env](#📝-cấu-hình-env)
4. [Test đăng nhập](#🧪-test-đăng-nhập)

---

## 🔍 Lấy Google API Keys

### Bước 1: Truy cập Google Cloud Console
1. Mở https://console.developers.google.com
2. Đăng nhập bằng Google Account (hoặc tạo mới)
3. Tạo project mới:
   - Click "Select a Project" (góc trái)
   - Click "NEW PROJECT"
   - Nhập tên: `HyperMart OAuth`
   - Click "CREATE"
   - Đợi project được tạo (khoảng 1-2 phút)

### Bước 2: Enable Google+ API
1. Tìm kiếm "Google+ API" trong công cụ tìm kiếm (phía trên)
2. Click vào "Google+ API"
3. Click nút xanh "ENABLE"

### Bước 3: Tạo OAuth 2.0 Credentials
1. Vào menu **Credentials** (bên trái)
2. Click "+ CREATE CREDENTIALS"
3. Chọn "OAuth client ID"
4. Chọn "Configure OAuth consent screen" nếu được yêu cầu
5. Điền thông tin:
   - **User Type**: Chọn "External"
   - Click "CREATE"
   - **App name**: `HyperMart`
   - **User support email**: nhập email của bạn
   - **Developer contact**: nhập email của bạn
   - Click "SAVE AND CONTINUE" (skip các bước tiếp theo)

### Bước 4: Tạo OAuth Client ID
1. Quay lại **Credentials**
2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
3. **Application type**: Chọn "Web application"
4. **Name**: `HyperMart Web Client`
5. **Authorized JavaScript origins**: Thêm:
   ```
   http://localhost:3000
   http://localhost:5173
   ```
6. **Authorized redirect URIs**: Thêm:
   ```
   http://localhost:3000/api/auth/oauth/google/callback
   ```
7. Click "CREATE"
8. **Copy** Client ID và Client Secret

### Kết quả
Bạn sẽ nhận được:
- **Client ID**: `xxxxx.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxx`

---

## 🔍 Lấy Facebook API Keys

### Bước 1: Truy cập Facebook Developers
1. Mở https://developers.facebook.com
2. Đăng nhập Facebook (hoặc tạo tài khoản)
3. Chọn "My Apps" → "+ Create App"
4. Chọn "Consumer"
5. Điền thông tin:
   - **App Name**: `HyperMart`
   - **App Contact Email**: nhập email
   - **Purpose**: chọn "Shopping & Commerce" (hoặc mục phù hợp khác)
   - Click "Create App"
   - Nhập mã xác minh nếu được yêu cầu

### Bước 2: Thêm Facebook Login
1. Tìm **"Facebook Login"** trong danh sách products
2. Click "Set Up"
3. Chọn **"Web"**
4. Nhập Site URL: `http://localhost:5173`
5. Click "Save"
6. Bỏ qua các bước tiếp theo, click "Settings" → "Basic"

### Bước 3: Lấy App ID và Secret
1. Vào **Settings** → **Basic**
2. Bạn sẽ thấy:
   - **App ID**
   - **App Secret** (click "Show")
3. **Copy** cả hai giá trị

### Bước 4: Cấu hình Redirect URI
1. Vào **Products** → **Facebook Login** → **Settings**
2. Tìm "Valid OAuth Redirect URIs"
3. Thêm:
   ```
   http://localhost:3000/api/auth/oauth/facebook/callback
   ```
4. Click "Save Changes"

### Kết quả
Bạn sẽ có:
- **App ID**: `1234567890`
- **App Secret**: `xxxxxxxxxxxxx`

---

## 📝 Cấu hình .env

Mở file `.env` ở thư mục gốc backend và thêm:

```env
# ============ OAuth (Google & Facebook) ============
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET

FACEBOOK_APP_ID=YOUR_FACEBOOK_APP_ID
FACEBOOK_APP_SECRET=YOUR_FACEBOOK_APP_SECRET
```

**Ví dụ:**
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456

FACEBOOK_APP_ID=1234567890
FACEBOOK_APP_SECRET=abc123def456ghi789
```

---

## 🧪 Test đăng nhập

### 1. Khởi động Backend
```bash
cd e:\Developer\ecommerce-backend
npm run dev
```

### 2. Khởi động Frontend (terminal khác)
```bash
cd e:\Developer\ecommerce-backend\frontend
npm run dev
```

### 3. Test đăng nhập
1. Mở http://localhost:5173/login
2. Click nút "Đăng nhập bằng Google"
3. Đăng nhập Google account của bạn
4. Nếu thành công → redirect về trang chủ ✅

### 4. Kiểm tra Console
Nếu có lỗi, check:
- **Browser Console** (F12): có error gì?
- **Backend Terminal**: có log gì từ server?
- **.env file**: Client ID, Secret đúng chưa?

---

## ⚠️ Lưu ý quan trọng

### Localhost Testing
- `http://localhost` là **loopback domain** - chỉ có trên máy của bạn
- Không thể test OAuth từ máy khác nhau qua localhost
- Khi deploy production: phải thay thế localhost → domain thật (vd: `https://example.com`)

### Security
- ❌ **KHÔNG** commit `.env` lên Git (có API secrets)
- ✅ Thêm `.env` vào `.gitignore`

### Troubleshooting

**Lỗi: "Invalid Redirect URI"**
- Kiểm tra URL callback có chính xác không?
- Backend URL phải match trong callback settings

**Lỗi: "Client ID không tìm thấy"**
- .env file chưa có GOOGLE_CLIENT_ID
- Check cách cấu hình .env có đúng không?

**Lỗi: "CORS error"**
- Backend không cho phép frontend call
- Check FRONTEND_URL và CLIENT_ORIGIN trong .env

---

## 📞 Cần giúp?

Nếu có vấn đề:
1. Check lại các bước trên
2. Xem console backend có error gì
3. Xem browser console (F12) có error gì
