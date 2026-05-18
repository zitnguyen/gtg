const mongoose = require("mongoose");

const chessExerciseSchema = new mongoose.Schema(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    sourceType: {
      type: String,
      enum: ["pgn", "fen", "image"],
      default: "pgn",
      index: true,
    },
    sourceFileUrl: { type: String, trim: true, default: "" },
    title: { type: String, trim: true, default: "" },
    startFen: { type: String, trim: true, required: true },
    solutionSan: { type: String, trim: true, default: "" },
    solutionUci: { type: String, trim: true, default: "" },
    hintText: { type: String, trim: true, default: "" },
    explanation: { type: String, trim: true, default: "" },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    tags: [{ type: String, trim: true }],
    parseWarnings: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

chessExerciseSchema.index({ lessonId: 1, status: 1 });

module.exports = mongoose.model("ChessExercise", chessExerciseSchema);
