import { MoveList } from "../../chess-ui";

const MoveTree = ({ moves, cursor, onJump, qualityByPly }) => (
  <div className="rounded-2xl bg-slate-900/85 border border-slate-800 p-4 shadow-xl">
    <div className="text-sm font-semibold text-white mb-2">Cây nước đi</div>
    <MoveList
      moves={moves}
      cursor={cursor}
      onJump={onJump}
      qualityByPly={qualityByPly}
      emptyState="Nhập PGN hoặc FEN để bắt đầu phân tích."
    />
  </div>
);

export default MoveTree;
