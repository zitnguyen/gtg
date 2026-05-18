const mongoose = require("mongoose");

const puzzleAssignmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    puzzleIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Puzzle",
        required: true,
      },
    ],
    deadline: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["active", "completed", "expired"],
      default: "active",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PuzzleAssignment", puzzleAssignmentSchema);
