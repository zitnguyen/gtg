const mongoose = require("mongoose");

const exerciseAssignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "mixed"],
      default: "mixed",
    },
    tags: [{ type: String, trim: true }],
    positionFen: { type: String, trim: true, default: "" },
    exerciseIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChessExercise",
        required: true,
      },
    ],
    studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
    classIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }],
    assignedDate: { type: Date, required: true, index: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

exerciseAssignmentSchema.index({ assignedDate: 1, status: 1 });

module.exports = mongoose.model("ExerciseAssignment", exerciseAssignmentSchema);
