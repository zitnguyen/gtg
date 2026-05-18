const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const { protect, optionalProtect, authorize } = require("../middleware/authMiddleware");

// Public Read (Admin/Teacher có thể thấy bản nháp khi truyền status=all|draft)
router.get("/", optionalProtect, postController.getPosts);
router.get("/:id", optionalProtect, postController.getPost); // id can be slug

// Protected Write (Admin/Teacher)
router.post("/", protect, authorize("Admin", "Teacher"), postController.createPost);
router.put("/:id", protect, authorize("Admin", "Teacher"), postController.updatePost);
router.delete("/:id", protect, authorize("Admin", "Teacher"), postController.deletePost);

module.exports = router;
