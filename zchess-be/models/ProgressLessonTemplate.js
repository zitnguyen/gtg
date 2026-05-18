const mongoose = require("mongoose");

const lessonItemSchema = new mongoose.Schema(
  {
    order: { type: Number, default: 0 },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
  },
  { _id: true },
);

const progressLessonTemplateSchema = new mongoose.Schema(
  {
    levelKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    levelLabel: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    lessons: { type: [lessonItemSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

progressLessonTemplateSchema.index({ sortOrder: 1, levelLabel: 1 });

module.exports = mongoose.model(
  "ProgressLessonTemplate",
  progressLessonTemplateSchema,
);
