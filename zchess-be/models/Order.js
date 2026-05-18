const mongoose = require("mongoose");

const ORDER_STATUSES = [
  "pending",
  "completed",
  "cancelled",
  "refunded",
  "partially_refunded",
];

const ORDER_PAYMENT_METHODS = ["bank_transfer", "momo", "cash", "other"];

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: [
      {
        courseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
          required: true,
        },
        price: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ORDER_PAYMENT_METHODS,
      default: "bank_transfer",
    },
    transactionId: { type: String, trim: true },
    paidAt: { type: Date, default: null },
    refundAmount: { type: Number, default: 0, min: 0 },
    refundedAt: { type: Date, default: null },
    refundReason: { type: String, trim: true, maxlength: 500 },
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

orderSchema.index({ userId: 1, status: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
module.exports.ORDER_STATUSES = ORDER_STATUSES;
