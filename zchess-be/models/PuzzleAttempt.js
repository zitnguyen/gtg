const mongoose = require("mongoose");

const moveLogSchema = new mongoose.Schema(
  {
    move: { type: String, required: true, trim: true },
    fenBefore: { type: String, required: true, trim: true },
    fenAfter: { type: String, required: true, trim: true },
    timestamp: { type: Number, required: true },
  },
  { _id: false },
);

const puzzleAttemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    puzzleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Puzzle",
      required: true,
      index: true,
    },
    moves: [moveLogSchema],
    result: {
      type: String,
      enum: ["completed", "failed"],
      default: "failed",
      index: true,
    },
    accuracy: { type: Number, default: 0, min: 0, max: 100 },
    timeSpent: { type: Number, default: 0, min: 0 }, // seconds
    firstMoveAt: { type: Date, default: null },
    lastMoveAt: { type: Date, default: null },
  },
  { timestamps: true },
);

puzzleAttemptSchema.index({ studentId: 1, puzzleId: 1 }, { unique: true });

module.exports = mongoose.model("PuzzleAttempt", puzzleAttemptSchema);
