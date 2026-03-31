require("dotenv").config();

const { createApp } = require("./app");
const { connectDb } = require("./config/db");

async function start() {
  const port = Number(process.env.PORT || 3000);
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecommerce";

  // Thêm log ở đây để biết nó đang kết nối đi đâu
  console.log("Connecting to MongoDB...");
  await connectDb(mongoUri);
  console.log("Connected to MongoDB successfully!"); // Dòng này sẽ giúp bạn tự tin hơn

  const app = createApp();

  app.listen(port, () => {
    console.log(`API running at http://localhost:${port}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", err);
  process.exit(1);
});

