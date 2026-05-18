const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, orderController.createOrder);

router.get(
  "/my-orders",
  protect,
  orderController.getMyOrdersForAuthUser,
);

router.get(
  "/admin/all",
  protect,
  authorize("Admin"),
  orderController.listAllOrders,
);

router.get(
  "/myorders/:userId",
  protect,
  authorize("Admin"),
  orderController.getMyOrders,
);

router.get("/:id", protect, orderController.getOrderById);
router.put("/:id/pay", protect, orderController.updateOrderStatus);
router.post(
  "/:id/refund",
  protect,
  authorize("Admin"),
  orderController.refundOrder,
);

module.exports = router;
