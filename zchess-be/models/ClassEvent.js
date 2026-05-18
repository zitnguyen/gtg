const mongoose = require("mongoose");

/**
 * ClassEvent — sự kiện cấp buổi học (không phải lịch định kỳ):
 *   - cancelled: huỷ buổi
 *   - rescheduled: dời lịch buổi (originalDate → newDate)
 *   - substituted: GV thay
 *   - makeup: buổi bù (newDate, có thể trỏ về 1 cancelled trước đó qua relatedEventId)
 */
const CLASS_EVENT_TYPES = ["cancelled", "rescheduled", "substituted", "makeup"];

const classEventSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: CLASS_EVENT_TYPES,
      required: true,
      index: true,
    },
    originalDate: { type: Date, required: true, index: true },
    newDate: { type: Date, default: null },
    originalTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    substituteTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    relatedEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassEvent",
      default: null,
    },
    reason: { type: String, trim: true, maxlength: 500 },
    notifiedAt: { type: Date, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

classEventSchema.index({ classId: 1, originalDate: -1, type: 1 });
classEventSchema.index({ classId: 1, newDate: 1, type: 1 });

module.exports = mongoose.model("ClassEvent", classEventSchema);
module.exports.CLASS_EVENT_TYPES = CLASS_EVENT_TYPES;
