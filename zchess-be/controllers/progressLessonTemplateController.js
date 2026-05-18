const ProgressLessonTemplate = require("../models/ProgressLessonTemplate");
const asyncHandler = require("../middleware/asyncHandler");

const normalizeLessons = (lessons) => {
  if (!Array.isArray(lessons)) return [];
  return lessons
    .map((item, index) => {
      const title = String(item?.title || "").trim();
      const content = String(item?.content || "").trim();
      return {
        order: Number(item?.order ?? index),
        title,
        content,
      };
    })
    .filter((item) => item.title)
    .sort((a, b) => a.order - b.order);
};

exports.listTemplates = asyncHandler(async (req, res) => {
  const query =
    req.user?.role === "Admin" ? {} : { isActive: true };
  const items = await ProgressLessonTemplate.find(query)
    .sort({ sortOrder: 1, levelLabel: 1 })
    .lean();
  res.json(items);
});

exports.getTemplateById = asyncHandler(async (req, res) => {
  const item = await ProgressLessonTemplate.findById(req.params.id).lean();
  if (!item) {
    return res.status(404).json({ message: "Không tìm thấy level mẫu" });
  }
  if (!item.isActive && req.user?.role !== "Admin") {
    return res.status(404).json({ message: "Không tìm thấy level mẫu" });
  }
  res.json(item);
});

exports.createTemplate = asyncHandler(async (req, res) => {
  const levelKey = String(req.body.levelKey || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  const levelLabel = String(req.body.levelLabel || "").trim();
  if (!levelKey || !levelLabel) {
    return res
      .status(400)
      .json({ message: "Mã level và tên level là bắt buộc" });
  }

  const exists = await ProgressLessonTemplate.exists({ levelKey });
  if (exists) {
    return res.status(400).json({ message: "Mã level đã tồn tại" });
  }

  const item = await ProgressLessonTemplate.create({
    levelKey,
    levelLabel,
    sortOrder: Number(req.body.sortOrder || 0),
    lessons: normalizeLessons(req.body.lessons),
    isActive: req.body.isActive !== false,
  });
  res.status(201).json(item);
});

exports.updateTemplate = asyncHandler(async (req, res) => {
  const item = await ProgressLessonTemplate.findById(req.params.id);
  if (!item) {
    return res.status(404).json({ message: "Không tìm thấy level mẫu" });
  }

  if (req.body.levelKey !== undefined) {
    const levelKey = String(req.body.levelKey || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
    if (!levelKey) {
      return res.status(400).json({ message: "Mã level không hợp lệ" });
    }
    const duplicate = await ProgressLessonTemplate.exists({
      levelKey,
      _id: { $ne: item._id },
    });
    if (duplicate) {
      return res.status(400).json({ message: "Mã level đã tồn tại" });
    }
    item.levelKey = levelKey;
  }

  if (req.body.levelLabel !== undefined) {
    const levelLabel = String(req.body.levelLabel || "").trim();
    if (!levelLabel) {
      return res.status(400).json({ message: "Tên level là bắt buộc" });
    }
    item.levelLabel = levelLabel;
  }

  if (req.body.sortOrder !== undefined) {
    item.sortOrder = Number(req.body.sortOrder || 0);
  }
  if (req.body.lessons !== undefined) {
    item.lessons = normalizeLessons(req.body.lessons);
  }
  if (req.body.isActive !== undefined) {
    item.isActive = Boolean(req.body.isActive);
  }

  await item.save();
  res.json(item);
});

exports.deleteTemplate = asyncHandler(async (req, res) => {
  const item = await ProgressLessonTemplate.findByIdAndDelete(req.params.id);
  if (!item) {
    return res.status(404).json({ message: "Không tìm thấy level mẫu" });
  }
  res.json({ message: "Đã xóa level mẫu" });
});
