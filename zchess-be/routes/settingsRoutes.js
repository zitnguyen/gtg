const express = require("express");
const {
  protect,
  optionalProtect,
  authorize,
} = require("../middleware/authMiddleware");
const settingsController = require("../controllers/settingsController");

const router = express.Router();

router.get("/", optionalProtect, settingsController.getSettings);
router.get("/public-cms/public", settingsController.getPublicCms);
router.get(
  "/public-cms",
  protect,
  authorize("Admin"),
  settingsController.getAdminPublicCms,
);
router.patch(
  "/",
  protect,
  authorize("Admin"),
  settingsController.updateSettings,
);
router.patch(
  "/public-cms",
  protect,
  authorize("Admin"),
  settingsController.updatePublicCms,
);

module.exports = router;
