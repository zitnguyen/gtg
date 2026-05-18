/**
 * Task: Proxy câu đố daily từ API công khai Lichess (AGPL — ghi nguồn)
 * Tài liệu: https://lichess.org/api#tag/Puzzles/operation/apiPuzzleDaily
 * Tác giả: DucManh-BlueOC
 */
const asyncHandler = require("../middleware/asyncHandler");

const LICHESS_DAILY = "https://lichess.org/api/puzzle/daily";
const USER_AGENT =
  process.env.LICHESS_USER_AGENT ||
  "ZChessTraining/1.0 (https://github.com/; educational use; AGPL attribution)";

exports.getDailyPuzzle = asyncHandler(async (_req, res) => {
  const upstream = await fetch(LICHESS_DAILY, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });
  if (!upstream.ok) {
    return res.status(502).json({ message: "Không lấy được câu đố từ Lichess" });
  }
  const data = await upstream.json();
  const p = data?.puzzle;
  if (!p?.fen || !Array.isArray(p.solution)) {
    return res.status(502).json({ message: "Định dạng puzzle Lichess không hợp lệ" });
  }

  res.set("Cache-Control", "public, max-age=300");
  return res.json({
    source: "lichess",
    lichessPuzzleId: p.id,
    fen: p.fen,
    solutionUci: p.solution.map((m) => String(m || "").trim().toLowerCase()),
    rating: Number(p.rating) || 0,
    themes: Array.isArray(p.themes) ? p.themes : [],
    plays: Number(p.plays) || 0,
    lastMove: p.lastMove || null,
    gameId: data?.game?.id || null,
    attribution:
      "Dữ liệu câu đố © Lichess.org (https://lichess.org) — phần mềm tự do AGPL.",
  });
});
