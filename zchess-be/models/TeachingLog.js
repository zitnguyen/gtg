const mongoose = require("mongoose");

const teachingLogSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    salary: {
      type: Number,
      default: null,
      min: 0,
    },
    deductionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deductionNote: {
      type: String,
      trim: true,
      default: "",
    },
    bonusAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    bonusNote: {
      type: String,
      trim: true,
      default: "",
    },
    otherCostAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    otherCostNote: {
      type: String,
      trim: true,
      default: "",
    },
    durationHours: {
      type: Number,
      required: true,
      min: 0,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Paid"],
      default: "Pending",
    },
    category: {
      type: String,
      enum: ["regular", "makeup", "substituted"],
      default: "regular",
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassEvent",
      default: null,
    },
    originalTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

teachingLogSchema.index({ teacherId: 1, date: -1, status: 1 });
teachingLogSchema.index({ classId: 1, date: -1 });

module.exports = mongoose.model("TeachingLog", teachingLogSchema);
