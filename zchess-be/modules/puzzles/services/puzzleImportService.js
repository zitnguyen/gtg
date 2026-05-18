const puzzleRepository = require("../repositories/puzzleRepository");
const { isValidFen, normalizeText } = require("../validators/fenValidator");
const { previewPuzzleFromFile } = require("./puzzleDetectionService");

const toPuzzlePayload = ({ item, userId }) => ({
  fen: normalizeText(item?.fen),
  imagePreview: normalizeText(item?.imagePreview),
  source: "pdf",
  createdBy: userId,
});

const buildValidPuzzlePayloads = ({ puzzles = [], userId }) =>
  puzzles
    .map((item) => toPuzzlePayload({ item, userId }))
    .filter((item) => isValidFen(item.fen));

const confirmPuzzles = async ({ puzzles, userId }) => {
  const validPuzzles = buildValidPuzzlePayloads({ puzzles, userId });
  if (validPuzzles.length === 0) {
    const error = new Error("Không có puzzle hợp lệ để lưu.");
    error.statusCode = 400;
    throw error;
  }
  const docs = await puzzleRepository.insertPuzzles(validPuzzles);
  return { items: docs };
};

const uploadPdfAndSave = async ({ file, flip = false, userId }) => {
  const preview = await previewPuzzleFromFile({
    file,
    flip,
    context: "upload-pdf",
  });
  const rows = buildValidPuzzlePayloads({
    puzzles: preview.detections,
    userId,
  });

  if (!rows.length) {
    const error = new Error("Không phát hiện được puzzle hợp lệ từ PDF.");
    error.statusCode = 400;
    throw error;
  }

  const docs = await puzzleRepository.insertPuzzles(rows);
  return { items: docs, failedDetections: preview.failedDetections };
};

const listPuzzles = async () => {
  const items = await puzzleRepository.listRecentPuzzles({ limit: 500 });
  return { items };
};

module.exports = {
  confirmPuzzles,
  listPuzzles,
  uploadPdfAndSave,
};
