const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads", "avatars");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const logoUploadDir = path.join(__dirname, "..", "uploads", "settings");
if (!fs.existsSync(logoUploadDir)) {
  fs.mkdirSync(logoUploadDir, { recursive: true });
}
const heroMediaUploadDir = path.join(__dirname, "..", "uploads", "hero");
if (!fs.existsSync(heroMediaUploadDir)) {
  fs.mkdirSync(heroMediaUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, `avatar_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const allowedMimes = new Set(["image/jpeg", "image/jpg", "image/png"]);
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimes.has(file.mimetype)) {
      cb(new Error("Chỉ hỗ trợ file JPG/PNG"));
      return;
    }
    cb(null, true);
  },
});

const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, logoUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".png";
    cb(null, `logo_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimes.has(file.mimetype)) {
      cb(new Error("Chỉ hỗ trợ file JPG/PNG"));
      return;
    }
    cb(null, true);
  },
});

const heroMediaStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, heroMediaUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, `hero_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const allowedHeroMimes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "video/mp4",
  "video/webm",
]);
const heroMediaUpload = multer({
  storage: heroMediaStorage,
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedHeroMimes.has(file.mimetype)) {
      cb(new Error("Chỉ hỗ trợ JPG/PNG/MP4/WEBM"));
      return;
    }
    cb(null, true);
  },
});
const courseImageUpload = multer({
  storage: heroMediaStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimes.has(file.mimetype)) {
      cb(new Error("Chỉ hỗ trợ file JPG/PNG"));
      return;
    }
    cb(null, true);
  },
});
const chatImageUpload = multer({
  storage: heroMediaStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimes.has(file.mimetype)) {
      cb(new Error("Chỉ hỗ trợ file JPG/PNG"));
      return;
    }
    cb(null, true);
  },
});

router.post(
  "/avatar",
  protect,
  (req, res, next) => {
    upload.single("avatar")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "Kích thước ảnh tối đa 2MB" });
        }
        return res
          .status(400)
          .json({ message: err.message || "Upload ảnh thất bại" });
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn ảnh" });
    }
    const relativeUrl = `/uploads/avatars/${req.file.filename}`;
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return res.json({ url: `${baseUrl}${relativeUrl}` });
  },
);

router.post(
  "/logo",
  protect,
  authorize("Admin"),
  (req, res, next) => {
    logoUpload.single("logo")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "Kích thước ảnh tối đa 2MB" });
        }
        return res
          .status(400)
          .json({ message: err.message || "Upload logo thất bại" });
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn logo" });
    }
    const relativeUrl = `/uploads/settings/${req.file.filename}`;
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return res.json({
      success: true,
      data: { url: `${baseUrl}${relativeUrl}` },
    });
  },
);

router.post(
  "/payment-qr",
  protect,
  authorize("Admin"),
  (req, res, next) => {
    logoUpload.single("qr")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "Kích thước ảnh tối đa 2MB" });
        }
        return res
          .status(400)
          .json({ message: err.message || "Upload QR thất bại" });
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn ảnh QR" });
    }
    const relativeUrl = `/uploads/settings/${req.file.filename}`;
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return res.json({ url: `${baseUrl}${relativeUrl}` });
  },
);

router.post(
  "/public-cms-media",
  protect,
  authorize("Admin"),
  (req, res, next) => {
    courseImageUpload.single("media")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "Kích thước ảnh tối đa 5MB" });
        }
        return res
          .status(400)
          .json({ message: err.message || "Upload ảnh CMS thất bại" });
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn ảnh" });
    }
    const relativeUrl = `/uploads/hero/${req.file.filename}`;
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return res.json({ url: `${baseUrl}${relativeUrl}` });
  },
);

router.post(
  "/course-image",
  protect,
  authorize("Admin"),
  (req, res, next) => {
    courseImageUpload.single("image")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "Kích thước ảnh tối đa 5MB" });
        }
        return res
          .status(400)
          .json({ message: err.message || "Upload ảnh khóa học thất bại" });
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn ảnh" });
    }
    const relativeUrl = `/uploads/hero/${req.file.filename}`;
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return res.json({ url: `${baseUrl}${relativeUrl}` });
  },
);

router.post(
  "/hero-media",
  protect,
  authorize("Admin"),
  (req, res, next) => {
    heroMediaUpload.single("media")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .json({ message: "Kích thước media tối đa 30MB" });
        }
        return res
          .status(400)
          .json({ message: err.message || "Upload media thất bại" });
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn file media" });
    }
    const relativeUrl = `/uploads/hero/${req.file.filename}`;
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";
    return res.json({ url: `${baseUrl}${relativeUrl}`, mediaType });
  },
);

router.post(
  "/chat-image",
  protect,
  authorize("Admin", "Teacher", "Parent", "Student"),
  (req, res, next) => {
    chatImageUpload.single("image")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "Kích thước ảnh tối đa 5MB" });
        }
        return res.status(400).json({ message: err.message || "Upload ảnh chat thất bại" });
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn ảnh" });
    }
    const relativeUrl = `/uploads/hero/${req.file.filename}`;
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return res.json({ url: `${baseUrl}${relativeUrl}` });
  },
);

module.exports = router;
