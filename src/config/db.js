const mongoose = require("mongoose");

let connectionPromise;

async function connectDb(mongoUri) {
  if (!mongoUri) throw new Error("Missing MONGO_URI");

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    mongoose.set("strictQuery", true);
    connectionPromise = mongoose.connect(mongoUri).catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  await connectionPromise;
  return mongoose.connection;
}

module.exports = { connectDb };
