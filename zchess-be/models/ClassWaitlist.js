const mongoose = require("mongoose");

const WAITLIST_STATUSES = ["waiting", "promoted", "cancelled", "expired"];

const classWaitlistSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    position: { type: Number, default: 0 },
    status: {
      type: String,
      enum: WAITLIST_STATUSES,
      default: "waiting",
      index: true,
    },
    joinedAt: { type: Date, default: Date.now },
    promotedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    notes: { type: String, trim: true, maxlength: 500 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

// Một học viên chỉ được waitlist 1 lần đang `waiting` cho 1 lớp.
classWaitlistSchema.index(
  { classId: 1, studentId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "waiting" },
  },
);
classWaitlistSchema.index({ classId: 1, status: 1, position: 1 });

module.exports = mongoose.model("ClassWaitlist", classWaitlistSchema);
module.exports.WAITLIST_STATUSES = WAITLIST_STATUSES;
