import { useCallback, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  EvalBar,
} from "../../chess-ui";
import {
  setEngineDepth,
  setEngineMultipv,
  disposeEngine,
} from "../../../stores/engineStore";
import { formatScore } from "../../../lib/chess-engine/evaluationParser";
import AnalysisBoard from "../components/AnalysisBoard";
import AnalysisToolbar from "../components/AnalysisToolbar";
import EnginePanel from "../components/EnginePanel";
import EvalGraph from "../components/EvalGraph";
import MoveTree from "../components/MoveTree";
import PgnPanel from "../components/PgnPanel";
import VariationPanel from "../components/VariationPanel";
import useEngineAnalysis from "../hooks/useEngineAnalysis";
import useMoveTree from "../hooks/useMoveTree";
import usePgnReplay from "../hooks/usePgnReplay";

const copyToClipboard = (text) => {
  if (!text) return;
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
};

const AnalysisPage = () => {
  const tree = useMoveTree();
  const [engineEnabled, setEngineEnabled] = useState(true);

  const engine = useEngineAnalysis({
    fen: tree.activeFen,
    enabled: engineEnabled,
    multipv: tree.state.engineMultipv,
    depth: tree.state.engineDepth,
  });

  usePgnReplay({
    onNext: tree.handleNext,
    onPrev: tree.handlePrev,
    onStart: tree.handleStart,
    onEnd: tree.handleEnd,
    onFlip: tree.handleFlip,
  });

  const handleCopyFen = () => {
    copyToClipboard(tree.activeFen);
    toast.success("Đã sao chép FEN");
  };

  const handleCopyPgn = () => {
    const game = new Chess(tree.state.rootFen);
    tree.state.moves.forEach((move) => {
      try {
        game.move(move.san);
      } catch {
        // ignore
      }
    });
    copyToClipboard(game.pgn());
    toast.success("Đã sao chép PGN");
  };

  const handleToggleEngine = useCallback(() => {
    setEngineEnabled((prev) => {
      const next = !prev;
      if (!next) disposeEngine();
      return next;
    });
  }, []);

  const cursor = tree.state.cursor;
  const moves = tree.state.moves.map((m) => m.san);

  const lastMoveUci = useMemo(() => {
    const move = tree.state.moves[cursor - 1];
    return move?.uci || null;
  }, [cursor, tree.state.moves]);

  const evalCpForWhite = engine.evalCpForWhite || 0;
  const evalLabel = engine.lines?.[0]
    ? formatScore(engine.lines[0].score, engine.sideToMove)
    : "0.00";

  const evalGraphData = useMemo(() => {
    // Foundation: the graph reflects the current top engine line. For now we
    // record the latest cp per ply once the user navigates. A future pass
    // will run a full review of the line and persist evals server-side.
    return tree.state.moves.map((_, idx) => ({
      cp: idx === cursor - 1 ? evalCpForWhite : 0,
    }));
  }, [cursor, evalCpForWhite, tree.state.moves]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-sky-300 font-semibold">
              Analysis Board
            </div>
            <h1 className="text-2xl font-bold">Phân tích thế cờ</h1>
            <p className="text-sm text-slate-400">
              Chơi tự do, tải PGN/FEN, theo dõi đánh giá engine và biến phụ.
            </p>
            {/* Task: Phím tắt kiểu desktop analysis (lichess-like) — DucManh-BlueOC */}
            <p className="text-xs text-slate-500 mt-2 max-w-xl">
              Phím tắt:{" "}
              <kbd className="rounded bg-slate-800 px-1">←</kbd> /{" "}
              <kbd className="rounded bg-slate-800 px-1">→</kbd> lùi/tiến nước,{" "}
              <kbd className="rounded bg-slate-800 px-1">Home</kbd> /{" "}
              <kbd className="rounded bg-slate-800 px-1">End</kbd> đầu/cuối ván,{" "}
              <kbd className="rounded bg-slate-800 px-1">F</kbd> lật bàn (không
              gõ trong ô nhập liệu).
            </p>
          </div>
          <AnalysisToolbar
            onStart={tree.handleStart}
            onPrev={tree.handlePrev}
            onNext={tree.handleNext}
            onEnd={tree.handleEnd}
            onFlip={tree.handleFlip}
            onReset={tree.handleReset}
            onCopyFen={handleCopyFen}
            onCopyPgn={handleCopyPgn}
            onToggleEngine={handleToggleEngine}
            engineEnabled={engineEnabled}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[64px_1fr_360px] gap-4">
          <div className="hidden lg:flex justify-center pt-2">
            <EvalBar
              cpForWhite={evalCpForWhite}
              orientation={tree.state.orientation}
              height={520}
              width={18}
              label={evalLabel}
            />
          </div>
          <div className="space-y-3 min-w-0">
            <AnalysisBoard
              fen={tree.activeFen}
              orientation={tree.state.orientation}
              onPlay={tree.handlePlay}
              bestmoveUci={engine.bestmove}
              lastMoveUci={lastMoveUci}
            />
            <EvalGraph
              data={evalGraphData}
              cursor={cursor}
              onSelect={tree.handleJump}
            />
          </div>
          <aside className="space-y-3">
            <MoveTree
              moves={moves}
              cursor={cursor}
              onJump={tree.handleJump}
            />
            <EnginePanel
              status={engine.status}
              error={engine.error}
              lines={engine.lines}
              bestmove={engine.bestmove}
              sideToMove={engine.sideToMove}
              multipv={engine.multipv}
              depth={engine.depth}
              onChangeMultiPv={(v) => setEngineMultipv(v)}
              onChangeDepth={(v) => setEngineDepth(v)}
            />
            <VariationPanel branches={tree.state.branches} />
            <PgnPanel
              onLoadPgn={tree.handleLoadPgn}
              onLoadFen={tree.handleLoadFen}
              onCopyFen={handleCopyFen}
              onCopyPgn={handleCopyPgn}
            />
          </aside>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalysisPage;
