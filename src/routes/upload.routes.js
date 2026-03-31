const express = require("express");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { requireCsrf } = require("../middlewares/csrf");
const { upload } = require("../middlewares/upload");

const router = express.Router();

router.post(
  "/image",
  requireCsrf,
  requireAuth,
  requireRole("admin"),
  upload.single("image"),
  (req, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "Missing image file" });
    const url = `/uploads/${file.filename}`;
    res.status(201).json({ url });
  }
);

module.exports = router;

