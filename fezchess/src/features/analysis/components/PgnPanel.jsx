import { useState } from "react";
import { Upload } from "lucide-react";

const PgnPanel = ({ onLoadPgn, onLoadFen, onCopyFen, onCopyPgn }) => {
  const [pgn, setPgn] = useState("");
  const [fen, setFen] = useState("");

  return (
    <div className="rounded-2xl bg-slate-900/85 border border-slate-800 p-4 shadow-xl space-y-3">
      <div className="text-sm font-semibold text-white">Nhập PGN / FEN</div>
      <div>
        <label className="text-xs uppercase tracking-wider text-slate-400">
          PGN
        </label>
        <textarea
          value={pgn}
          onChange={(e) => setPgn(e.target.value)}
          rows={5}
          placeholder="1. e4 e5 2. Nf3 Nc6..."
          className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono p-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={() => onLoadPgn?.(pgn)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white"
          >
            <Upload size={14} />
            Tải PGN
          </button>
          <button
            type="button"
            onClick={onCopyPgn}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Copy PGN từ ván hiện tại
          </button>
        </div>
      </div>
      <div>
        <label className="text-xs uppercase tracking-wider text-slate-400">
          FEN
        </label>
        <input
          value={fen}
          onChange={(e) => setFen(e.target.value)}
          placeholder="rnbqkbnr/pppppppp/..."
          className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono p-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={() => onLoadFen?.(fen)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white"
          >
            <Upload size={14} />
            Tải FEN
          </button>
          <button
            type="button"
            onClick={onCopyFen}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Copy FEN hiện tại
          </button>
        </div>
      </div>
    </div>
  );
};

export default PgnPanel;
