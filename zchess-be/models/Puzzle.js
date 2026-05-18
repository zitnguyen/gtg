const mongoose = require("mongoose");

const puzzleSchema = new mongoose.Schema(
  {
    fen: { type: String, required: true, trim: true, index: true },
    source: {
      type: String,
      enum: ["pdf", "manual"],
      default: "manual",
      index: true,
    },
    imagePreview: { type: String, trim: true, default: "" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

module.exports = mongoose.model("Puzzle", puzzleSchema);
