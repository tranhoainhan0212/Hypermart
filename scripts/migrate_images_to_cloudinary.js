require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { v2: cloudinary } = require("cloudinary");

const { connectDb } = require("../src/config/db");
const Product = require("../src/models/Product");

function parseArgs(argv) {
  const args = {
    dryRun: false,
    limit: undefined,
    productId: undefined,
  };

  if (process.env.npm_config_dry_run === "true") args.dryRun = true;
  if (process.env.npm_config_limit) args.limit = Number(process.env.npm_config_limit);
  if (process.env.npm_config_product) args.productId = process.env.npm_config_product;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--dry-run") args.dryRun = true;
    if (token === "--limit" && argv[i + 1]) args.limit = Number(argv[i + 1]);
    if (token === "--product" && argv[i + 1]) args.productId = argv[i + 1];
    if (token.startsWith("--limit=")) args.limit = Number(token.split("=")[1]);
    if (token.startsWith("--product=")) args.productId = token.split("=")[1];
  }

  return args;
}

function ensureCloudinaryConfig() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Missing Cloudinary environment variables");
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
}

function isLocalUploadUrl(url) {
  return typeof url === "string" && url.startsWith("/uploads/");
}

function buildLocalFilePath(url) {
  const filename = url.replace(/^\/uploads\//, "");
  return path.join(process.cwd(), "uploads", filename);
}

async function uploadLocalFileToCloudinary(localFilePath, product) {
  const folder = process.env.CLOUDINARY_FOLDER || "ecommerce";
  const publicId = `${product.slug || product._id}-${path.parse(localFilePath).name}`;

  const result = await cloudinary.uploader.upload(localFilePath, {
    folder,
    resource_type: "image",
    public_id: publicId,
    overwrite: false,
    unique_filename: false,
  });

  return result.secure_url;
}

async function migrateProduct(product, options) {
  let changed = false;
  const nextImages = [];

  for (const image of product.images || []) {
    if (!isLocalUploadUrl(image.url)) {
      nextImages.push(image);
      continue;
    }

    const localFilePath = buildLocalFilePath(image.url);
    if (!fs.existsSync(localFilePath)) {
      console.warn(`Missing file for ${product._id}: ${image.url}`);
      nextImages.push(image);
      continue;
    }

    if (options.dryRun) {
      console.log(`[dry-run] ${product._id} ${image.url} -> ${localFilePath}`);
      nextImages.push(image);
      changed = true;
      continue;
    }

    const secureUrl = await uploadLocalFileToCloudinary(localFilePath, product);
    console.log(`Uploaded ${product._id}: ${image.url} -> ${secureUrl}`);
    nextImages.push({
      ...image.toObject(),
      url: secureUrl,
    });
    changed = true;
  }

  if (!changed || options.dryRun) return changed;

  product.images = nextImages;
  await product.save();
  return true;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  ensureCloudinaryConfig();

  await connectDb(process.env.MONGO_URI);

  const filter = { "images.url": /^\/uploads\// };
  if (options.productId) filter._id = options.productId;

  let query = Product.find(filter).sort({ createdAt: 1 });
  if (Number.isFinite(options.limit) && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const products = await query;
  if (products.length === 0) {
    console.log("No products with local upload images found.");
    return;
  }

  console.log(
    `${options.dryRun ? "Previewing" : "Migrating"} ${products.length} product(s) with local images`
  );

  let migratedCount = 0;
  for (const product of products) {
    const changed = await migrateProduct(product, options);
    if (changed) migratedCount += 1;
  }

  console.log(
    `${options.dryRun ? "Dry run complete" : "Migration complete"}: ${migratedCount}/${products.length} product(s) affected`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
