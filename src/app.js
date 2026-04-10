const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const passport = require("passport");
// const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

require("./config/passport");

const { notFound, errorHandler } = require("./middlewares/error");
const { checkOrigin } = require("./middlewares/csrf");
const authRoutes = require("./routes/auth.routes");
const categoryRoutes = require("./routes/category.routes");
const productRoutes = require("./routes/product.routes");
const uploadRoutes = require("./routes/upload.routes");
const reviewRoutes = require("./routes/review.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");
const adminRoutes = require("./routes/admin.routes");
const oauthRoutes = require("./routes/oauth.routes");
const paymentRoutes = require("./routes/payment.routes");
const { uploadDir } = require("./services/mediaStorage");
const { getAllowedOrigins } = require("./config/runtime");

function createApp() {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    })
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS policy"));
      },
      credentials: true,
    })
  );

  app.use("/uploads", express.static(uploadDir));

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // app.use(mongoSanitize());
  // app.use(xss());

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    })
  );

  if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

  app.use(checkOrigin);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "ecommerce-api", allowedOrigins });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/auth/oauth", oauthRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
