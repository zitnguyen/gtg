/**
 * Task: Đối kháng cờ realtime giữa thành viên (phòng mã + Socket.IO)
 * Tác giả: DucManh-BlueOC
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import LoginLink from "../../../components/auth/LoginLink";
import { Chess } from "chess.js";
import { toast } from "sonner";
import { Copy, Flag, Loader2 } from "lucide-react";
import authService from "../../../services/authService";
import liveGameService from "../../../services/liveGameService";
import { getRealtimeSocket } from "../../../services/realtimeSocket";
import { TrainingBoard, useBoardInteraction } from "../../chess-ui";

const readMeId = () => {
  const u = authService.getCurrentUser();
  if (!u) return "";
  return String(u._id || u.userId || "");
};

const LiveGamePage = () => {
  const { code: codeParam } = useParams();
  const navigate = useNavigate();
  const me = readMeId();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(Boolean(codeParam));
  const [joining, setJoining] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState("");

  useEffect(() => {
    if (!me || !codeParam) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await liveGameService.getByCode(codeParam);
        if (!cancelled) setGame(res.game);
      } catch (e) {
        if (!cancelled) {
          setGame(null);
          toast.error(
            e?.response?.data?.message || "Không tải được phòng — kiểm tra mã hoặc đăng nhập.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [me, codeParam]);

  const isParticipant = useMemo(() => {
    if (!game || !me || !game.whitePlayer) return false;
    const w = String(game.whitePlayer._id);
    const b = game.blackPlayer ? String(game.blackPlayer._id) : "";
    return me === w || (b && me === b);
  }, [game, me]);

  useEffect(() => {
    if (!me || !codeParam || !game || !isParticipant) return undefined;
    const socket = getRealtimeSocket();
    if (!socket) return undefined;

    const onState = (state) => setGame(state);
    socket.on("live:state", onState);
    socket.emit(
      "live:join",
      { code: String(codeParam).toUpperCase() },
      (res) => {
        if (res?.ok && res?.state) setGame(res.state);
        else if (res?.error) toast.error(res.error);
      },
    );
    return () => {
      socket.off("live:state", onState);
    };
  }, [me, codeParam, isParticipant]);

  const myColor = useMemo(() => {
    if (!game || !me || !game.whitePlayer) return null;
    if (String(game.whitePlayer._id) === me) return "w";
    if (game.blackPlayer && String(game.blackPlayer._id) === me) return "b";
    return null;
  }, [game, me]);

  const isMyTurn = useMemo(() => {
    if (!game || game.status !== "playing" || !myColor) return false;
    try {
      return new Chess(game.fen).turn() === myColor;
    } catch {
      return false;
    }
  }, [game, myColor]);

  const onCommitMove = useCallback(
    (move) => {
      if (!game?.code) return;
      const socket = getRealtimeSocket();
      if (!socket) {
        toast.error("Chưa kết nối realtime — thử đăng nhập lại.");
        return;
      }
      socket.emit(
        "live:move",
        {
          code: game.code,
          from: move.from,
          to: move.to,
          promotion: move.promotion || undefined,
        },
        (res) => {
          if (!res?.ok) toast.error(res?.error || "Nước đi không được chấp nhận");
          if (res?.ok && res?.state) setGame(res.state);
        },
      );
    },
    [game?.code],
  );

  const interaction = useBoardInteraction({
    fen: game?.fen || new Chess().fen(),
    allowMove: () => isMyTurn,
    onCommit: onCommitMove,
  });

  const handleCreate = async () => {
    try {
      const res = await liveGameService.create();
      navigate(`/play/live/${res.game.code}`);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Không tạo được phòng");
    }
  };

  const handleJoinRest = async () => {
    if (!codeParam) return;
    setJoining(true);
    try {
      const res = await liveGameService.join(codeParam);
      setGame(res.game);
      toast.success("Đã vào phòng — chúc bạn chơi tốt!");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Không vào được phòng");
    } finally {
      setJoining(false);
    }
  };

  const handleResign = async () => {
    if (!game?.code) return;
    if (!window.confirm("Bạn chắc muốn xin thua ván này?")) return;
    try {
      const res = await liveGameService.resign(game.code);
      setGame(res.game);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Không gửi được xin thua");
    }
  };

  const copyInvite = () => {
    if (!game?.code) return;
    const url = `${window.location.origin}/play/live/${game.code}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(
        () => toast.success("Đã sao chép link mời"),
        () => toast.error("Không sao chép được"),
      );
    }
  };

  const goRoom = () => {
    const c = String(roomCodeInput || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);
    if (c.length !== 6) {
      toast.error("Nhập đúng mã phòng 6 ký tự");
      return;
    }
    navigate(`/play/live/${c}`);
  };

  if (!me) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold mb-2">Đối kháng online</h1>
        <p className="text-slate-400 text-center text-sm mb-6 max-w-md">
          Đăng nhập bằng tài khoản thành viên (học viên, phụ huynh, giáo viên…) để
          tạo phòng hoặc tham gia ván cờ với người khác trong hệ thống.
        </p>
        <LoginLink className="px-6 py-3 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-500">
          Đăng nhập
        </LoginLink>
      </div>
    );
  }

  if (!codeParam) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10 md:py-14">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-bold mb-2">Đối kháng với thành viên</h1>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Bạn làm Trắng, gửi link cho đối thủ. Họ đăng nhập và vào phòng sẽ là
            Quân đen. Các nước đi được đồng bộ realtime.
          </p>
          <button
            type="button"
            onClick={handleCreate}
            className="w-full py-3 rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-500 mb-6"
          >
            Tạo phòng mới
          </button>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-xs font-semibold uppercase text-slate-500 mb-2">
              Đã có mã phòng?
            </p>
            <div className="flex gap-2">
              <input
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value)}
                placeholder="VD: ABC12X"
                maxLength={8}
                className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm uppercase"
              />
              <button
                type="button"
                onClick={goRoom}
                className="px-4 py-2 rounded-lg bg-slate-700 font-medium text-sm hover:bg-slate-600"
              >
                Vào
              </button>
            </div>
          </div>
          <p className="mt-8 text-center text-sm text-slate-500">
            <Link to="/training" className="text-sky-400 hover:underline">
              ← Về trung tâm câu đố & luyện
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (loading && !game) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
        Đang tải phòng…
      </div>
    );
  }

  const canJoinPreview =
    game?.status === "waiting" &&
    game?.canJoin &&
    myColor === null &&
    game?.whitePlayer;

  const shareUrl =
    typeof window !== "undefined" && game?.code
      ? `${window.location.origin}/play/live/${game.code}`
      : "";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-6 md:py-10 overflow-x-hidden">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-sky-400 font-semibold">
              Phòng {game?.code || codeParam}
            </p>
            <h1 className="text-xl md:text-2xl font-bold">Đối kháng online</h1>
          </div>
          <Link
            to="/training"
            className="text-sm text-slate-400 hover:text-white"
          >
            Câu đố & luyện
          </Link>
        </div>

        {/* Task: Hiển thị Elo (sàn 100) — DucManh-BlueOC */}
        {game?.whitePlayer ? (
          <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300 border border-slate-800 rounded-xl bg-slate-900/50 px-4 py-3 min-w-0 max-w-full">
            <span className="min-w-0 max-w-full inline-flex items-center gap-1">
              Trắng:{" "}
              <strong className="text-white truncate max-w-[220px] sm:max-w-[320px]">
                {String(game.whitePlayer.fullName || game.whitePlayer.username || "").trim()}
              </strong>
              <span className="text-sky-400 font-mono ml-1">
                {Number(game.whitePlayer.elo) || 100}
              </span>
            </span>
            {game.blackPlayer ? (
              <span className="min-w-0 max-w-full inline-flex items-center gap-1">
                Đen:{" "}
                <strong className="text-white truncate max-w-[220px] sm:max-w-[320px]">
                  {String(game.blackPlayer.fullName || game.blackPlayer.username || "").trim()}
                </strong>
                <span className="text-sky-400 font-mono ml-1">
                  {Number(game.blackPlayer.elo) || 100}
                </span>
              </span>
            ) : (
              <span className="text-slate-500">Đen: chờ đối thủ…</span>
            )}
          </div>
        ) : null}

        {game?.status === "waiting" && myColor === "w" ? (
          <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
            <p className="font-medium text-amber-100">Đang chờ đối thủ vào phòng…</p>
            <p className="text-amber-200/80 text-xs mt-1 break-all">{shareUrl}</p>
            <button
              type="button"
              onClick={copyInvite}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-100 hover:underline"
            >
              <Copy className="h-3.5 w-3.5" />
              Sao chép link
            </button>
          </div>
        ) : null}

        {canJoinPreview ? (
          <div className="mb-4 rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-4">
            <p className="text-sm text-sky-100 mb-3">
              Host:{" "}
              <strong>{game.whitePlayer?.fullName || game.whitePlayer?.username}</strong>
              — bạn sẽ cầm quân Đen nếu vào phòng.
            </p>
            <button
              type="button"
              disabled={joining}
              onClick={handleJoinRest}
              className="w-full py-2.5 rounded-lg bg-sky-600 font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
            >
              {joining ? "Đang vào…" : "Tham gia (Quân đen)"}
            </button>
          </div>
        ) : null}

        {game?.status === "completed" ? (
          <div className="mb-4 rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-sm">
            {game.winnerId ? (
              <p>
                Kết quả:{" "}
                <strong className="text-emerald-400">
                  {String(game.winnerId) === String(game.whitePlayer?._id)
                    ? "Trắng thắng"
                    : "Đen thắng"}
                </strong>
                {game.endReason ? ` (${game.endReason})` : ""}
              </p>
            ) : (
              <p>Hòa {game.endReason ? `(${game.endReason})` : ""}</p>
            )}
            {game.eloApplied ? (
              <p className="mt-2 text-xs text-slate-400">
                Thay đổi Elo: Trắng{" "}
                <span className="font-mono text-sky-300">
                  {game.whiteEloDelta >= 0 ? "+" : ""}
                  {game.whiteEloDelta}
                </span>
                {" · "}Đen{" "}
                <span className="font-mono text-sky-300">
                  {game.blackEloDelta >= 0 ? "+" : ""}
                  {game.blackEloDelta}
                </span>
              </p>
            ) : null}
          </div>
        ) : null}

        {game && isParticipant && game.status === "playing" ? (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleResign}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900/50 text-rose-100 text-sm border border-rose-800 hover:bg-rose-900/70"
            >
              <Flag className="h-4 w-4" />
              Xin thua
            </button>
            {!isMyTurn && game.status === "playing" ? (
              <span className="text-xs text-slate-500">Đang chờ đối thủ…</span>
            ) : null}
          </div>
        ) : null}

        {game && isParticipant ? (
          <div className="max-w-[min(100%,480px)] mx-auto">
            <TrainingBoard
              id="live-game-board"
              fen={game.fen}
              orientation={myColor === "b" ? "black" : "white"}
              onPieceDrop={interaction.onPieceDrop}
              onSquareClick={interaction.onSquareClick}
              selectedSquare={interaction.selectedSquare}
              legalMoves={interaction.legalMoves}
              allowDragging={game.status === "playing" && isMyTurn}
              themeKey="midnight"
            />
            {interaction.invalidMessage ? (
              <p className="text-center text-rose-400 text-sm mt-2">
                {interaction.invalidMessage}
              </p>
            ) : null}
          </div>
        ) : !canJoinPreview && game ? (
          <p className="text-slate-500 text-sm text-center py-10">
            Không có quyền xem ván này. Kiểm tra mã phòng hoặc tài khoản.
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default LiveGamePage;
