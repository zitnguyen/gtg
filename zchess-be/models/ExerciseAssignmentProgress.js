const mongoose = require("mongoose");

const puzzleProgressSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChessExercise",
      required: true,
    },
    attempts: { type: Number, default: 0, min: 0 },
    correctMoves: { type: Number, default: 0, min: 0 },
    wrongMoves: { type: Number, default: 0, min: 0 },
    solved: { type: Boolean, default: false },
    solvedAt: { type: Date, default: null },
    timeSpentSec: { type: Number, default: 0, min: 0 },
    lastAnswer: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const exerciseAssignmentProgressSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExerciseAssignment",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    puzzleProgress: [puzzleProgressSchema],
    totalPuzzles: { type: Number, default: 0, min: 0 },
    solvedPuzzles: { type: Number, default: 0, min: 0 },
    correctMoves: { type: Number, default: 0, min: 0 },
    wrongMoves: { type: Number, default: 0, min: 0 },
    accuracy: { type: Number, default: 0, min: 0, max: 100 },
    timeSpentSec: { type: Number, default: 0, min: 0 },
    startedAt: { type: Date, default: Date.now },
    completed: { type: Boolean, default: false, index: true },
    completedAt: { type: Date, default: null },
    lastActivityAt: { type: Date, default: Date.now },
    submittedCount: { type: Number, default: 0, min: 0 },
    latestSubmittedFen: { type: String, trim: true, default: "" },
    submissions: [
      {
        fen: { type: String, trim: true, default: "" },
        pgn: { type: String, trim: true, default: "" },
        moves: [{ type: String, trim: true }],
        submittedAt: { type: Date, default: Date.now },
        timeSpentSec: { type: Number, default: 0, min: 0 },
      },
    ],
  },
  { timestamps: true },
);

exerciseAssignmentProgressSchema.index(
  { assignmentId: 1, studentId: 1 },
  { unique: true },
);

module.exports = mongoose.model(
  "ExerciseAssignmentProgress",
  exerciseAssignmentProgressSchema,
);
