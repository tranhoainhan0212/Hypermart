const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
const { v2: cloudinary } = require("cloudinary");
const { HttpError } = require("../utils/httpError");

const uploadDir =
  process.env.NODE_ENV === "production" ? "/tmp/uploads" : path.join(process.cwd(), "uploads");

function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function buildFilename(originalname = "") {
  const ext = path.extname(originalname).toLowerCase();
  const safeExt = [".png", ".jpg", ".jpeg", ".webp"].includes(ext) ? ext : "";
  return `${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`;
}

async function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const publicId = path.parse(buildFilename(file.originalname)).name;
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_FOLDER || "ecommerce",
        resource_type: "image",
        public_id: publicId,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed"));
          return;
        }
        resolve({ url: result.secure_url });
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
}

async function saveToLocal(file) {
  ensureUploadDir();
  const filename = buildFilename(file.originalname);
  const filepath = path.join(uploadDir, filename);
  await fs.promises.writeFile(filepath, file.buffer);
  return { url: `/uploads/${filename}` };
}

async function storeImage(file) {
  if (!file?.buffer) {
    throw new HttpError(400, "Missing image file");
  }

  if (isCloudinaryConfigured()) {
    try {
      return await uploadToCloudinary(file);
    } catch {
      throw new HttpError(502, "Cloudinary upload failed");
    }
  }

  return saveToLocal(file);
}

module.exports = {
  storeImage,
  uploadDir,
};
