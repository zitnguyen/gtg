const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true }, // Denormalized for easier queries
  type: { 
    type: String, 
    enum: ["video", "text", "quiz", "chess"], 
    default: "video" 
  },
  content: { type: String }, // Video URL or text content
  chessMode: {
    type: String,
    enum: ["external", "internal"],
    default: "internal",
  },
  chessPlatform: { type: String, trim: true, default: "" },
  initialFen: { type: String, trim: true, default: "" },
  initialPgn: { type: String, trim: true, default: "" },
  initialMoves: [{ type: String, trim: true }],
  initialMoveNotes: [{ type: String, trim: true }],
  chessBackgroundUrl: { type: String, trim: true, default: "" },
  exerciseMode: { type: Boolean, default: false },
  duration: { type: Number, default: 0 },
  isFree: { type: Boolean, default: false }, 
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Lesson = mongoose.model("Lesson", lessonSchema);
module.exports = Lesson;
