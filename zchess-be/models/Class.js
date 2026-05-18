const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    classId: {
      type: String,
      required: true,
      unique: true,
      default: () => `CL-${Date.now()}`
    },

    className: {
      type: String,
      required: true,
    },

    description: String,
    fee: Number,
    level: String,
    maxStudents: Number,
    totalSessions: { type: Number, default: 16 },
    durationWeeks: Number,

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },

    startDate: {
      type: Date,
    },

    schedule: { type: String },
    scheduleSlots: [
      {
        day: { type: Number, min: 0, max: 6, required: true },
        time: { type: String, required: true },
        duration: { type: Number, default: 90 },
      },
    ],
    room: {
      type: String,
      enum: ["Học tại trung tâm", "Học online", "Học kèm tại nhà"],
      default: "Học tại trung tâm",
    },
    studentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    currentStudents: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["Pending", "Active", "Finished", "Cancelled", "OnHold"],
      default: "Pending",
      index: true,
    },
  },
  { timestamps: true }
);

classSchema.index({ teacherId: 1, status: 1 });
classSchema.index({ status: 1, startDate: 1 });

module.exports = mongoose.model("Class", classSchema);
