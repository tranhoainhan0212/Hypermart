require("dotenv").config();

const { createApp } = require("./src/app");
const { connectDb } = require("./src/config/db");

const app = createApp();
let ready;

async function ensureReady() {
  if (!ready) {
    ready = connectDb(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecommerce").catch((error) => {
      ready = null;
      throw error;
    });
  }
  await ready;
}

module.exports = async (req, res) => {
  await ensureReady();
  return app(req, res);
};
