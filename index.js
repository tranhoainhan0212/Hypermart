const express = require("express");
const app = express();

// PORT
const PORT = 3000;

// Route test
app.get("/", (req, res) => {
  res.send("Hello World - Server đang chạy 🚀");
});

// Run server
app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});

module.exports = app;