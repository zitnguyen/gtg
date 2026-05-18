const express = require("express");
const router = express.Router();
const controller = require("../controllers/progressLessonTemplateController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { validateObjectIdParam } = require("../middleware/paramValidationMiddleware");

router.get(
  "/",
  protect,
  authorize("Admin", "Teacher"),
  controller.listTemplates,
);
router.get(
  "/:id",
  protect,
  authorize("Admin", "Teacher"),
  validateObjectIdParam("id"),
  controller.getTemplateById,
);
router.post("/", protect, authorize("Admin"), controller.createTemplate);
router.put(
  "/:id",
  protect,
  authorize("Admin"),
  validateObjectIdParam("id"),
  controller.updateTemplate,
);
router.delete(
  "/:id",
  protect,
  authorize("Admin"),
  validateObjectIdParam("id"),
  controller.deleteTemplate,
);

module.exports = router;
