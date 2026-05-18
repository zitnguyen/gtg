const { extractFenFromFile } = require("../vision/pythonVisionClient");
const { isValidFen, normalizeText } = require("../validators/fenValidator");
const { logFailedDetections } = require("./detectionFailureLogger");

const normalizeDetection = (item, index) => ({
  index,
  fen: normalizeText(item?.fen),
  imagePreview: normalizeText(item?.imagePreview),
  confidence: Number(item?.confidence || 0),
  validFen: isValidFen(item?.fen),
  debug: item?.debug || {},
});

const normalizeDetections = (data) => {
  const rawDetections = Array.isArray(data?.detections) ? data.detections : [];
  return rawDetections
    .map(normalizeDetection)
    .filter((item) => Boolean(item.fen || item.imagePreview));
};

const previewPuzzleFromFile = async ({ file, flip = false, context = "preview" }) => {
  if (!file?.buffer) {
    const error = new Error("Vui lòng tải file PDF.");
    error.statusCode = 400;
    throw error;
  }

  const data = await extractFenFromFile({
    fileBuffer: file.buffer,
    fileName: file.originalname || "input.pdf",
    flip,
  });
  const failedDetections = Array.isArray(data?.failedDetections)
    ? data.failedDetections
    : [];
  logFailedDetections(failedDetections, context);

  return {
    fileName: file.originalname || "",
    detections: normalizeDetections(data),
    failedDetections,
  };
};

module.exports = {
  normalizeDetections,
  previewPuzzleFromFile,
};
