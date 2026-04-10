const multer = require("multer");
const { HttpError } = require("../utils/httpError");

function fileFilter(_req, file, cb) {
  const ok = ["image/png", "image/jpeg", "image/webp"].includes(file.mimetype);
  cb(ok ? null : new HttpError(400, "Only png/jpg/webp allowed"), ok);
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

module.exports = { upload };
