require("dotenv").config();
const mongoose = require("mongoose");
const Lesson = require("../models/Lesson");
const ChessExercise = require("../models/ChessExercise");
const User = require("../models/User");
const { Chess } = require("chess.js");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const lessons = await Lesson.find({
    type: "chess",
    chessMode: "internal",
    initialMoves: { $exists: true, $ne: [] },
  }).select("_id title initialFen initialMoves initialMoveNotes");
  const adminUser = await User.findOne({ role: "Admin" }).select("_id");
  if (!adminUser?._id) {
    throw new Error("Không tìm thấy user Admin để gán createdBy/updatedBy.");
  }

  for (const lesson of lessons) {
    const exists = await ChessExercise.exists({ lessonId: lesson._id });
    if (exists) continue;
    const firstMove = lesson.initialMoves?.[0];
    if (!firstMove) continue;
    await ChessExercise.create({
      lessonId: lesson._id,
      sourceType: "pgn",
      title: `${lesson.title || "Lesson"} - Exercise 1`,
      startFen: lesson.initialFen || new Chess().fen(),
      solutionSan: String(firstMove || ""),
      hintText: String(lesson.initialMoveNotes?.[0] || ""),
      explanation: String(lesson.initialMoveNotes?.[0] || ""),
      status: "draft",
      parseWarnings: ["Tạo tự động từ initialMoves. Vui lòng admin review trước khi publish."],
      createdBy: adminUser._id,
      updatedBy: adminUser._id,
    });
    console.log(`Migrated lesson: ${lesson._id} - ${lesson.title}`);
  }

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
