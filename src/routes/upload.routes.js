const express = require("express");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { requireCsrf } = require("../middlewares/csrf");
const { upload } = require("../middlewares/upload");
const { storeImage } = require("../services/mediaStorage");

const router = express.Router();

router.post(
  "/image",
  requireCsrf,
  requireAuth,
  requireRole("admin"),
  upload.single("image"),
  async (req, res) => {
    const uploaded = await storeImage(req.file);
    res.status(201).json({ url: uploaded.url });
  }
);

module.exports = router;
