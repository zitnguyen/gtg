const mongoose = require("mongoose");

const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "excused",
  "late",
  "makeup",
];

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: false,
    },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ATTENDANCE_STATUSES,
      default: "absent",
    },
    note: { type: String, trim: true, maxlength: 500 },
    isMakeup: { type: Boolean, default: false },
    originalDate: { type: Date, default: null },
    relatedEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassEvent",
      default: null,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    idempotencyKey: { type: String, trim: true, maxlength: 80 },
  },
  { timestamps: true },
);

// Một học viên × 1 lớp × 1 ngày → 1 bản ghi duy nhất.
// (Lưu ý: thực hiện trên `dateKey` text bậc ngày để chính xác hơn — ở đây dùng day-anchor 12:00 từ controller.)
attendanceSchema.index(
  { studentId: 1, classId: 1, date: 1 },
  { unique: true, partialFilterExpression: { classId: { $exists: true } } },
);
attendanceSchema.index({ classId: 1, date: -1 });
attendanceSchema.index({ studentId: 1, date: -1 });
attendanceSchema.index(
  { idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } },
);

const Attendance = mongoose.model("Attendance", attendanceSchema);
module.exports = Attendance;
module.exports.ATTENDANCE_STATUSES = ATTENDANCE_STATUSES;
