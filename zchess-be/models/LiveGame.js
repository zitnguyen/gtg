/**
 * Task: Ván cờ realtime giữa hai thành viên (phòng mã + FEN/moves)
 * Tác giả: DucManh-BlueOC
 */
const mongoose = require("mongoose");

const liveGameSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 6,
      maxlength: 6,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    whitePlayer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blackPlayer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["waiting", "playing", "completed", "abandoned"],
      default: "waiting",
    },
    fen: { type: String, required: true },
    moves: [
      {
        from: { type: String, required: true },
        to: { type: String, required: true },
        promotion: { type: String, default: "" },
      },
    ],
    winnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    endReason: { type: String, default: "" },
    eloApplied: { type: Boolean, default: false },
    whiteEloDelta: { type: Number, default: 0 },
    blackEloDelta: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("LiveGame", liveGameSchema);
