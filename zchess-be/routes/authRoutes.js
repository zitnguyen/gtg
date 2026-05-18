const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const {
  signinLimiter,
  signupLimiter,
  refreshLimiter,
} = require("../middleware/securityMiddleware");
const {
  signinValidation,
  signupValidation,
} = require("../middleware/validationMiddleware");

router.post("/signup", signupLimiter, signupValidation, authController.signup);
router.post("/signin", signinLimiter, signinValidation, authController.signin);
router.post("/signout", protect, authController.signout);
router.post("/refresh", refreshLimiter, authController.refresh);

module.exports = router;
