import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Eval graph approximating Lichess. Pass the timeline of evaluations keyed by
 * ply (centipawns from white POV). The graph fills above zero in white, below
 * in black.
 */
const clampCp = (cp) => Math.max(-1500, Math.min(1500, cp));

const EvalGraph = ({ data = [], cursor = 0, onSelect }) => {
  const chartData = useMemo(
    () =>
      data.map((point, idx) => ({
        ply: idx + 1,
        cp: clampCp(point.cp ?? 0),
      })),
    [data],
  );

  if (!chartData.length) {
    return (
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 text-xs text-slate-400 italic h-32 flex items-center justify-center">
        Chưa có dữ liệu eval cho ván này.
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-900/85 border border-slate-800 p-2 shadow-xl">
      <div className="h-32 w-full">
        <ResponsiveContainer>
          <AreaChart
            data={chartData}
            onClick={(payload) =>
              onSelect && payload?.activeLabel
                ? onSelect(payload.activeLabel)
                : null
            }
            margin={{ top: 6, right: 6, left: 6, bottom: 6 }}
          >
            <defs>
              <linearGradient id="cpUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f8fafc" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#f8fafc" stopOpacity={0.4} />
              </linearGradient>
              <linearGradient id="cpDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#020617" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#020617" stopOpacity={0.95} />
              </linearGradient>
            </defs>
            <XAxis hide dataKey="ply" />
            <YAxis hide domain={[-1500, 1500]} />
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="2 2" />
            <ReferenceLine
              x={cursor || 0}
              stroke="#38bdf8"
              strokeWidth={2}
              ifOverflow="visible"
            />
            <Tooltip
              contentStyle={{
                background: "rgba(15, 23, 42, 0.92)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                borderRadius: 8,
                color: "white",
                fontSize: 12,
              }}
              labelFormatter={(value) => `Nước ${value}`}
              formatter={(value) => [(value / 100).toFixed(2), "Eval"]}
            />
            <Area
              type="monotone"
              dataKey="cp"
              stroke="#94a3b8"
              fill="url(#cpUp)"
              fillOpacity={1}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EvalGraph;
