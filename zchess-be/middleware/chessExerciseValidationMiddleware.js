const mongoose = require("mongoose");

const validateImportPayload = (req, res, next) => {
  const { sourceType = "pgn", lessonId, content = "" } = req.body || {};
  if (!lessonId || !mongoose.Types.ObjectId.isValid(lessonId)) {
    return res.status(400).json({ message: "lessonId không hợp lệ" });
  }
  if (!["pgn", "fen", "image"].includes(String(sourceType))) {
    return res.status(400).json({ message: "sourceType phải là pgn|fen|image" });
  }
  if (String(sourceType) !== "image" && !String(content || "").trim() && !req.file) {
    return res.status(400).json({ message: "Thiếu nội dung PGN/FEN để import" });
  }
  return next();
};

const validatePublishPayload = (req, res, next) => {
  const { solutionSan, solutionUci } = req.body || {};
  if (!String(solutionSan || "").trim() && !String(solutionUci || "").trim()) {
    return res
      .status(400)
      .json({ message: "Cần solutionSan hoặc solutionUci trước khi publish" });
  }
  return next();
};

module.exports = {
  validateImportPayload,
  validatePublishPayload,
};
