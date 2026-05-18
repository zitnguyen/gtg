/**
 * Task: Elo đơn giản (kiểu Elo cổ điển) sau ván đối kháng — sàn 100
 * Tác giả: DucManh-BlueOC
 */
const User = require("../models/User");
const LiveGame = require("../models/LiveGame");

const FLOOR = 100;
const K = 32;

const expected = (ratingA, ratingB) =>
  1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));

/**
 * @param {number} whiteRating
 * @param {number} blackRating
 * @param {number} scoreWhite — 1 | 0.5 | 0
 */
const computePair = (whiteRating, blackRating, scoreWhite) => {
  const Rw = Math.max(FLOOR, Number(whiteRating) || FLOOR);
  const Rb = Math.max(FLOOR, Number(blackRating) || FLOOR);
  const Ew = expected(Rw, Rb);
  const Eb = expected(Rb, Rw);
  const newW = Math.round(Rw + K * (scoreWhite - Ew));
  const newB = Math.round(Rb + K * (1 - scoreWhite - Eb));
  return {
    whiteElo: Math.max(FLOOR, newW),
    blackElo: Math.max(FLOOR, newB),
    deltaWhite: Math.round(newW - Rw),
    deltaBlack: Math.round(newB - Rb),
  };
};

/**
 * Áp Elo một lần khi ván kết thúc (tránh gọi trùng).
 */
exports.applyLiveGameElo = async (gameId) => {
  const game = await LiveGame.findById(gameId);
  if (!game || game.status !== "completed" || game.eloApplied) return null;
  if (!game.whitePlayer || !game.blackPlayer) return null;

  const [white, black] = await Promise.all([
    User.findById(game.whitePlayer).select("elo"),
    User.findById(game.blackPlayer).select("elo"),
  ]);
  if (!white || !black) return null;

  const Rw = Number.isFinite(white.elo) ? white.elo : FLOOR;
  const Rb = Number.isFinite(black.elo) ? black.elo : FLOOR;

  let scoreWhite = 0.5;
  if (game.winnerId) {
    if (String(game.winnerId) === String(game.whitePlayer)) scoreWhite = 1;
    else if (String(game.winnerId) === String(game.blackPlayer)) scoreWhite = 0;
  }

  const { whiteElo, blackElo, deltaWhite, deltaBlack } = computePair(Rw, Rb, scoreWhite);

  await Promise.all([
    User.findByIdAndUpdate(game.whitePlayer, { elo: whiteElo }),
    User.findByIdAndUpdate(game.blackPlayer, { elo: blackElo }),
  ]);

  game.eloApplied = true;
  game.whiteEloDelta = deltaWhite;
  game.blackEloDelta = deltaBlack;
  await game.save();

  return { whiteElo, blackElo, deltaWhite, deltaBlack };
};
