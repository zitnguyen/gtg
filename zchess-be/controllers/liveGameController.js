/**
 * Task: REST tạo phòng / tham gia / xem ván cờ live giữa thành viên
 * Tác giả: DucManh-BlueOC
 */
const { Chess } = require("chess.js");
const LiveGame = require("../models/LiveGame");
const { getSocketIo } = require("../realtime/socketHub");
const { applyLiveGameElo } = require("../services/eloService");

const liveRoom = (code) => `livegame:${String(code || "").toUpperCase()}`;

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const randomCode = () =>
  Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join(
    "",
  );

const pickUser = (u) => {
  if (!u) return null;
  const o = u.toObject ? u.toObject() : u;
  const elo = Number.isFinite(o.elo) ? o.elo : 100;
  return {
    _id: o._id,
    fullName: o.fullName || o.username || "Người chơi",
    username: o.username,
    avatarUrl: o.avatarUrl || "",
    elo,
  };
};

const serializeFull = (game) => ({
  code: game.code,
  status: game.status,
  fen: game.fen,
  moves: game.moves || [],
  whitePlayer: pickUser(game.whitePlayer),
  blackPlayer: game.blackPlayer ? pickUser(game.blackPlayer) : null,
  winnerId: game.winnerId || null,
  endReason: game.endReason || "",
  updatedAt: game.updatedAt,
  eloApplied: Boolean(game.eloApplied),
  whiteEloDelta: Number(game.whiteEloDelta) || 0,
  blackEloDelta: Number(game.blackEloDelta) || 0,
});

const serializePreview = (game) => ({
  code: game.code,
  status: game.status,
  fen: new Chess().fen(),
  whitePlayer: pickUser(game.whitePlayer),
  blackPlayer: null,
  canJoin: true,
  moves: [],
  winnerId: null,
  endReason: "",
});

exports.createGame = async (req, res) => {
  const chess = new Chess();
  let code;
  for (let i = 0; i < 12; i += 1) {
    code = randomCode();
    const exists = await LiveGame.exists({ code });
    if (!exists) break;
    if (i === 11) {
      return res.status(500).json({ message: "Không tạo được mã phòng, thử lại." });
    }
  }
  const game = await LiveGame.create({
    code,
    createdBy: req.user._id,
    whitePlayer: req.user._id,
    blackPlayer: null,
    status: "waiting",
    fen: chess.fen(),
    moves: [],
  });
  const populated = await LiveGame.findById(game._id)
    .populate("whitePlayer", "fullName username avatarUrl elo")
    .populate("blackPlayer", "fullName username avatarUrl elo");
  return res.status(201).json({ game: serializeFull(populated) });
};

exports.getByCode = async (req, res) => {
  const code = String(req.params.code || "")
    .toUpperCase()
    .trim();
  if (code.length !== 6) {
    return res.status(400).json({ message: "Mã phòng không hợp lệ" });
  }
  const game = await LiveGame.findOne({ code })
    .populate("whitePlayer", "fullName username avatarUrl elo")
    .populate("blackPlayer", "fullName username avatarUrl elo");
  if (!game) {
    return res.status(404).json({ message: "Không tìm thấy phòng" });
  }
  const uid = String(req.user._id);
  const w = String(game.whitePlayer._id || game.whitePlayer);
  const b = game.blackPlayer ? String(game.blackPlayer._id || game.blackPlayer) : null;

  if (uid === w || (b && uid === b)) {
    return res.json({ game: serializeFull(game) });
  }
  if (game.status === "waiting" && !b && uid !== w) {
    return res.json({ game: serializePreview(game) });
  }
  return res.status(403).json({ message: "Bạn không tham gia ván này" });
};

exports.joinByCode = async (req, res) => {
  const code = String(req.params.code || "")
    .toUpperCase()
    .trim();
  if (code.length !== 6) {
    return res.status(400).json({ message: "Mã phòng không hợp lệ" });
  }
  const game = await LiveGame.findOne({ code });
  if (!game) {
    return res.status(404).json({ message: "Không tìm thấy phòng" });
  }
  if (String(game.whitePlayer) === String(req.user._id)) {
    const populated = await LiveGame.findById(game._id)
      .populate("whitePlayer", "fullName username avatarUrl elo")
      .populate("blackPlayer", "fullName username avatarUrl elo");
    return res.json({ game: serializeFull(populated) });
  }
  if (game.blackPlayer) {
    return res.status(400).json({ message: "Phòng đã đủ người" });
  }
  if (game.status !== "waiting") {
    return res.status(400).json({ message: "Phòng không còn mở" });
  }
  game.blackPlayer = req.user._id;
  game.status = "playing";
  await game.save();
  const populated = await LiveGame.findById(game._id)
    .populate("whitePlayer", "fullName username avatarUrl elo")
    .populate("blackPlayer", "fullName username avatarUrl elo");
  const state = serializeFull(populated);
  const io = getSocketIo();
  if (io) io.to(liveRoom(code)).emit("live:state", state);
  return res.json({ game: state });
};

exports.resign = async (req, res) => {
  const code = String(req.params.code || "")
    .toUpperCase()
    .trim();
  const game = await LiveGame.findOne({ code });
  if (!game) {
    return res.status(404).json({ message: "Không tìm thấy phòng" });
  }
  if (game.status !== "playing") {
    return res.status(400).json({ message: "Ván không đang diễn ra" });
  }
  const uid = String(req.user._id);
  const w = String(game.whitePlayer);
  const b = String(game.blackPlayer || "");
  if (uid !== w && uid !== b) {
    return res.status(403).json({ message: "Không phải người chơi" });
  }
  const winner = uid === w ? game.blackPlayer : game.whitePlayer;
  game.status = "completed";
  game.winnerId = winner;
  game.endReason = "resign";
  await game.save();
  await applyLiveGameElo(game._id);
  const populated = await LiveGame.findById(game._id)
    .populate("whitePlayer", "fullName username avatarUrl elo")
    .populate("blackPlayer", "fullName username avatarUrl elo");
  const state = serializeFull(populated);
  const io = getSocketIo();
  if (io) io.to(liveRoom(code)).emit("live:state", state);
  return res.json({ game: state });
};
