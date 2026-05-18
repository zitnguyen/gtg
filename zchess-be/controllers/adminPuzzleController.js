const asyncHandler = require("../middleware/asyncHandler");
const puzzleDetectionService = require("../modules/puzzles/services/puzzleDetectionService");
const puzzleImportService = require("../modules/puzzles/services/puzzleImportService");
const puzzleAssignmentService = require("../modules/puzzles/services/puzzleAssignmentService");
const puzzleDetectionJobService = require("../modules/puzzles/services/puzzleDetectionJobService");

exports.previewPuzzleFromPdf = asyncHandler(async (req, res) => {
  const flip = String(req.body.flip || "").toLowerCase() === "true";
  const result = await puzzleDetectionService.previewPuzzleFromFile({
    file: req.file,
    flip,
    context: "preview",
  });
  return res.json(result);
});

exports.confirmPuzzleFromPreview = asyncHandler(async (req, res) => {
  const result = await puzzleImportService.confirmPuzzles({
    puzzles: Array.isArray(req.body.puzzles) ? req.body.puzzles : [],
    userId: req.user._id,
  });
  return res.status(201).json(result);
});

exports.uploadPdfAndSave = asyncHandler(async (req, res) => {
  const flip = String(req.body.flip || "").toLowerCase() === "true";
  const result = await puzzleImportService.uploadPdfAndSave({
    file: req.file,
    flip,
    userId: req.user._id,
  });
  return res.status(201).json(result);
});

exports.listPuzzles = asyncHandler(async (req, res) => {
  const result = await puzzleImportService.listPuzzles();
  return res.json(result);
});

exports.assignPuzzles = asyncHandler(async (req, res) => {
  const result = await puzzleAssignmentService.assignPuzzles({
    body: req.body,
    userId: req.user._id,
  });
  return res.status(201).json(result);
});

exports.createPreviewJob = asyncHandler(async (req, res) => {
  const flip = String(req.body.flip || "").toLowerCase() === "true";
  const job = puzzleDetectionJobService.createPreviewJob({
    file: req.file,
    flip,
    userId: req.user._id,
  });
  return res.status(202).json({ job });
});

exports.getPreviewJob = asyncHandler(async (req, res) => {
  const job = puzzleDetectionJobService.getPreviewJob(req.params.jobId);
  if (!job) return res.status(404).json({ message: "Không tìm thấy detection job." });
  return res.json({ job });
});
