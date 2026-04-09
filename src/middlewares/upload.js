const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { HttpError } = require("../utils/httpError");

// Cấu hình đường dẫn lưu file thông minh:
// Nếu đang chạy trên mạng (Vercel) -> dùng thư mục tạm /tmp/uploads
// Nếu chạy dưới máy tính (Local) -> dùng thư mục gốc uploads
const uploadDir = process.env.NODE_ENV === "production" 
  ? "/tmp/uploads" 
  : path.join(process.cwd(), "uploads");

// Tạo thư mục nếu nó chưa tồn tại
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".png", ".jpg", ".jpeg", ".webp"].includes(ext) ? ext : "";
    cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`);
  },
});

function fileFilter(_req, file, cb) {
  const ok = ["image/png", "image/jpeg", "image/webp"].includes(file.mimetype);
  cb(ok ? null : new HttpError(400, "Only png/jpg/webp allowed"), ok);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // Giới hạn file 2MB
});

module.exports = { upload, uploadDir };