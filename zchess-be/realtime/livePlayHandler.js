/**
 * Task: Socket.IO — đồng bộ nước đi ván live (live:join, live:move, live:resign)
 * Tác giả: DucManh-BlueOC
 */
const { Chess } = require("chess.js");
const LiveGame = require("../models/LiveGame");
const { applyLiveGameElo } = require("../services/eloService");

const roomFor = (code) => `livegame:${String(code || "").toUpperCase()}`;

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

async function loadGame(code) {
  return LiveGame.findOne({ code: String(code).toUpperCase() })
    .populate("whitePlayer", "fullName username avatarUrl elo")
    .populate("blackPlayer", "fullName username avatarUrl elo");
}

function assertPlayer(game, userId) {
  const w = String(game.whitePlayer?._id ?? game.whitePlayer);
  const b = game.blackPlayer ? String(game.blackPlayer?._id ?? game.blackPlayer) : "";
  const uid = String(userId);
  if (uid === w) return { w, b, uid };
  if (b && uid === b) return { w, b, uid };
  return null;
}

exports.attachLivePlayHandlers = (io, socket) => {
  const userId = socket.data?.userId;
  if (!userId) return;

  socket.on("live:join", async (payload, callback) => {
    const fn = typeof callback === "function" ? callback : () => {};
    try {
      const code = String(payload?.code || "")
        .toUpperCase()
        .trim();
      if (code.length !== 6) {
        fn({ ok: false, error: "Mã phòng không hợp lệ" });
        return;
      }
      const game = await loadGame(code);
      if (!game) {
        fn({ ok: false, error: "Không tìm thấy phòng" });
        return;
      }
      const role = assertPlayer(game, userId);
      if (!role) {
        fn({ ok: false, error: "Bạn không tham gia ván này" });
        return;
      }
      socket.join(roomFor(code));
      fn({ ok: true, state: serializeFull(game) });
    } catch (e) {
      console.error("live:join", e);
      fn({ ok: false, error: "Lỗi máy chủ" });
    }
  });

  socket.on("live:move", async (payload, callback) => {
    const fn = typeof callback === "function" ? callback : () => {};
    try {
      const code = String(payload?.code || "")
        .toUpperCase()
        .trim();
      const { from, to, promotion } = payload || {};
      if (code.length !== 6 || !from || !to) {
        fn({ ok: false, error: "Dữ liệu không hợp lệ" });
        return;
      }
      const game = await LiveGame.findOne({ code });
      if (!game) {
        fn({ ok: false, error: "Không tìm thấy phòng" });
        return;
      }
      const role = assertPlayer(game, userId);
      if (!role) {
        fn({ ok: false, error: "Forbidden" });
        return;
      }
      if (game.status !== "playing") {
        fn({ ok: false, error: "Ván chưa bắt đầu hoặc đã kết thúc" });
        return;
      }

      const chess = new Chess(game.fen);
      const movingSide = chess.turn();
      const expected =
        movingSide === "w" ? String(game.whitePlayer) : String(game.blackPlayer);
      if (String(userId) !== expected) {
        fn({ ok: false, error: "Không phải lượt của bạn" });
        return;
      }

      const moveInput = {
        from: String(from),
        to: String(to),
        promotion: promotion ? String(promotion).toLowerCase().slice(0, 1) : undefined,
      };
      let played;
      try {
        played = chess.move(moveInput);
      } catch {
        played = null;
      }
      if (!played) {
        fn({ ok: false, error: "Nước đi không hợp lệ" });
        return;
      }

      game.moves.push({
        from: played.from,
        to: played.to,
        promotion: played.promotion || "",
      });
      game.fen = chess.fen();

      if (chess.isGameOver()) {
        game.status = "completed";
        if (chess.isCheckmate()) {
          const winnerSide = movingSide === "w" ? game.whitePlayer : game.blackPlayer;
          game.winnerId = winnerSide;
          game.endReason = "checkmate";
        } else if (chess.isDraw()) {
          game.winnerId = null;
          game.endReason = chess.isStalemate() ? "stalemate" : "draw";
        } else {
          game.endReason = "draw";
        }
      }

      await game.save();
      if (game.status === "completed") {
        await applyLiveGameElo(game._id);
      }
      const populated = await loadGame(code);
      const state = serializeFull(populated);
      io.to(roomFor(code)).emit("live:state", state);
      fn({ ok: true, state });
    } catch (e) {
      console.error("live:move", e);
      fn({ ok: false, error: "Lỗi máy chủ" });
    }
  });

  socket.on("live:resign", async (payload, callback) => {
    const fn = typeof callback === "function" ? callback : () => {};
    try {
      const code = String(payload?.code || "")
        .toUpperCase()
        .trim();
      if (code.length !== 6) {
        fn({ ok: false, error: "Mã phòng không hợp lệ" });
        return;
      }
      const game = await LiveGame.findOne({ code });
      if (!game) {
        fn({ ok: false, error: "Không tìm thấy phòng" });
        return;
      }
      if (game.status !== "playing") {
        fn({ ok: false, error: "Ván không đang diễn ra" });
        return;
      }
      const role = assertPlayer(game, userId);
      if (!role) {
        fn({ ok: false, error: "Forbidden" });
        return;
      }
      const w = String(game.whitePlayer);
      const winner = String(userId) === w ? game.blackPlayer : game.whitePlayer;
      game.status = "completed";
      game.winnerId = winner;
      game.endReason = "resign";
      await game.save();
      await applyLiveGameElo(game._id);
      const populated = await loadGame(code);
      const state = serializeFull(populated);
      io.to(roomFor(code)).emit("live:state", state);
      fn({ ok: true, state });
    } catch (e) {
      console.error("live:resign", e);
      fn({ ok: false, error: "Lỗi máy chủ" });
    }
  });
};
