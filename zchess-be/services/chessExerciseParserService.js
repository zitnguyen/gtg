const { Chess } = require("chess.js");

const START_FEN = new Chess().fen();

const normalizeMove = (value) => String(value || "").trim();

const parsePgnToExercises = (pgnText) => {
  const game = new Chess();
  const ok = game.loadPgn(String(pgnText || ""));
  if (!ok) {
    throw new Error("PGN không hợp lệ hoặc không đọc được.");
  }
  const moves = game.history();
  if (!moves.length) {
    throw new Error("PGN không chứa nước đi nào.");
  }

  const replay = new Chess();
  const exercises = moves.map((san, index) => {
    const startFen = replay.fen();
    const move = replay.move(san);
    return {
      title: `Bài tập #${index + 1}`,
      startFen,
      solutionSan: move?.san || normalizeMove(san),
      solutionUci: move?.from && move?.to ? `${move.from}${move.to}` : "",
      parseWarnings: [],
    };
  });
  return { exercises, warnings: [] };
};

const parseFenToExercise = (fenText) => {
  const normalizedFen = String(fenText || "").trim();
  if (!normalizedFen) {
    throw new Error("FEN trống.");
  }
  const game = new Chess();
  const ok = game.load(normalizedFen);
  if (!ok) {
    throw new Error("FEN không hợp lệ.");
  }
  return {
    exercises: [
      {
        title: "Bài tập từ FEN",
        startFen: game.fen(),
        solutionSan: "",
        solutionUci: "",
        parseWarnings: ["Cần admin điền đáp án nước đi đúng trước khi publish."],
      },
    ],
    warnings: [],
  };
};

const parseImageToExerciseDraft = (imageUrl = "") => {
  return {
    exercises: [
      {
        title: "Bài tập từ ảnh (cần xác nhận)",
        startFen: START_FEN,
        solutionSan: "",
        solutionUci: "",
        parseWarnings: [
          "OCR ảnh chưa tự động xác định chính xác vị trí bàn cờ.",
          "Vui lòng admin chỉnh FEN và đáp án trước khi publish.",
          imageUrl ? `Nguồn ảnh: ${imageUrl}` : "Không có URL ảnh nguồn.",
        ],
      },
    ],
    warnings: ["Ảnh được import ở chế độ draft cần xác nhận thủ công."],
  };
};

const SAN_TOKEN_REGEX =
  /\b(?:O-O-O|O-O|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?|[a-h]x[a-h][1-8](?:=[QRBN])?[+#]?|[a-h][1-8](?:=[QRBN])?[+#]?)\b/g;

const parseLooseSanTextToExercises = (text) => {
  const raw = String(text || "");
  if (!raw.trim()) return { exercises: [], warnings: ["PDF trống."] };

  const cleaned = raw
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b1-0\b|\b0-1\b|\b1\/2-1\/2\b|\*/g, " ");

  const tokens = (cleaned.match(SAN_TOKEN_REGEX) || []).map((item) =>
    normalizeMove(item),
  );
  if (!tokens.length) {
    return {
      exercises: [],
      warnings: ["Không nhận diện được nước đi SAN trong PDF."],
    };
  }

  const game = new Chess();
  const legalMoves = [];
  const skipped = [];

  tokens.forEach((san) => {
    try {
      const moved = game.move(san, { sloppy: true });
      if (moved) {
        legalMoves.push(moved.san);
      } else {
        skipped.push(san);
      }
    } catch {
      skipped.push(san);
    }
  });

  if (legalMoves.length === 0) {
    return {
      exercises: [],
      warnings: ["Có nhận diện SAN nhưng không replay được trên bàn cờ."],
    };
  }

  const replay = new Chess();
  const exercises = legalMoves.map((san, index) => {
    const startFen = replay.fen();
    const moved = replay.move(san, { sloppy: true });
    return {
      title: `Bài tập SAN #${index + 1}`,
      startFen,
      solutionSan: moved?.san || san,
      solutionUci:
        moved?.from && moved?.to ? `${moved.from}${moved.to}${moved.promotion || ""}` : "",
      parseWarnings: [],
    };
  });

  const warnings = [];
  if (skipped.length > 0) {
    warnings.push(`Đã bỏ qua ${skipped.length} token SAN không hợp lệ.`);
  }

  return { exercises, warnings };
};

module.exports = {
  parsePgnToExercises,
  parseFenToExercise,
  parseImageToExerciseDraft,
  parseLooseSanTextToExercises,
};
