const mongoose = require("mongoose");

const ENROLLMENT_STATUSES = [
  "Active",
  "Completed",
  "Dropped",
  "Reserved",
  "Waitlist",
];

const PAYMENT_STATUSES = ["unpaid", "paid", "partial"];
const PAYMENT_METHODS = ["cash", "bank_transfer", "momo", "card", "other"];

const transferLogSchema = new mongoose.Schema(
  {
    fromClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
    toClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
    transferredAt: { type: Date, default: Date.now },
    transferredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    sessionsCarriedOver: { type: Number, default: 0, min: 0 },
    feeCarriedOver: { type: Number, default: 0, min: 0 },
    reason: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const paymentHistorySchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    paidAt: { type: Date, default: Date.now },
    method: { type: String, enum: PAYMENT_METHODS, default: "cash" },
    transactionId: { type: String, trim: true },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const enrollmentSchema = new mongoose.Schema(
  {
    enrollmentId: {
      type: String,
      required: true,
      unique: true,
      default: () => `EN-${Date.now()}`,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      index: true,
    },
    enrollmentDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ENROLLMENT_STATUSES,
      default: "Active",
      index: true,
    },
    feeAmount: { type: Number, default: 0, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "unpaid",
      index: true,
    },
    paymentDueDate: { type: Date, default: null, index: true },
    lastPaidAt: { type: Date, default: null },
    paymentHistory: { type: [paymentHistorySchema], default: [] },
    sessionsTotal: { type: Number, default: 0 },
    sessionsUsed: { type: Number, default: 0 },
    transferLog: { type: [transferLogSchema], default: [] },
    droppedAt: { type: Date, default: null },
    droppedReason: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

enrollmentSchema.index({ studentId: 1, status: 1 });
enrollmentSchema.index({ classId: 1, status: 1 });
enrollmentSchema.index({ paymentStatus: 1, paymentDueDate: 1 });

/**
 * Recompute paymentStatus mỗi khi paidAmount/feeAmount đổi.
 * Trả về số nợ còn lại (debt). Không tự save — caller chủ động.
 */
enrollmentSchema.methods.recomputePaymentStatus = function recomputePaymentStatus() {
  const fee = Number(this.feeAmount || 0);
  const paid = Number(this.paidAmount || 0);
  if (fee <= 0 || paid <= 0) {
    this.paymentStatus = paid > 0 ? "paid" : "unpaid";
  } else if (paid >= fee) {
    this.paymentStatus = "paid";
  } else {
    this.paymentStatus = "partial";
  }
  return Math.max(fee - paid, 0);
};

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
module.exports = Enrollment;
module.exports.ENROLLMENT_STATUSES = ENROLLMENT_STATUSES;
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
