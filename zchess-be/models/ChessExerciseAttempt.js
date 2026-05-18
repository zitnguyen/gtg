const mongoose = require("mongoose");

const chessExerciseAttemptSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChessExercise",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    attemptCount: { type: Number, default: 0, min: 0 },
    lastAnswer: { type: String, trim: true, default: "" },
    isSolved: { type: Boolean, default: false, index: true },
    solvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

chessExerciseAttemptSchema.index({ exerciseId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("ChessExerciseAttempt", chessExerciseAttemptSchema);
