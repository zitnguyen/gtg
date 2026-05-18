import React, { memo, useEffect, useState } from "react";

const LEVEL_SEQUENCE = [
  "kid1",
  "kid2",
  "level1",
  "level2",
  "level3",
  "level4",
  "level5",
  "level6",
  "level7",
  "level8",
  "level9",
  "level10",
];

const QUOTE =
  "“Bạn có thể học được nhiều điều hơn từ một trận thua hơn là từ một trận thắng.”";

/**
 * Decorative SVG "mountain" leaderboard for parent dashboard, extracted from
 * legacy ParentDashboard. Lazy-loaded so it doesn't bloat the main bundle.
 */
const MountainRankChart = memo(function MountainRankChart({
  items = [],
  selectedChildId,
}) {
  const [typedLength, setTypedLength] = useState(0);

  useEffect(() => {
    setTypedLength(0);
    const id = window.setInterval(() => {
      setTypedLength((prev) => {
        if (prev >= QUOTE.length) {
          window.clearInterval(id);
          return prev;
        }
        return prev + 1;
      });
    }, 22);
    return () => window.clearInterval(id);
  }, []);

  if (!items.length) return null;

  const width = 1200;
  const height = 460;

  const selectedItem =
    items.find((item) => String(item?._id) === String(selectedChildId)) ||
    items[0];
  const selectedLevel = String(selectedItem?.skillLevel || "").toLowerCase();
  const selectedIndex = Math.max(LEVEL_SEQUENCE.indexOf(selectedLevel), 0);

  const baseY = 436;
  const trackStartX = 82;
  const trackEndX = 760;
  const stepCount = LEVEL_SEQUENCE.length;
  const stepGap = (trackEndX - trackStartX) / (stepCount - 1);
  const stepRise = 26;
  const stepDepth = 44;
  const stepWidth = Math.max(42, stepGap - 12);
  const stepSkew = 44;

  const lastStepX = trackStartX + (stepCount - 1) * stepGap;
  const lastStepTopY = baseY - (stepCount - 1) * stepRise - stepDepth;
  const peakX = lastStepX + stepWidth + stepSkew + 18;
  const peakY = lastStepTopY - 8;

  return (
    <div className="relative rounded-xl border border-blue-100 bg-gradient-to-b from-blue-50/80 to-background px-4 pt-2 pb-0 dark:border-blue-900/40 dark:from-blue-950/30">
      <div className="absolute left-6 top-8 max-w-[560px] rounded-xl border border-blue-300/80 bg-white/95 px-5 py-4 shadow-md dark:bg-background/95 dark:border-blue-700/60">
        <p className="text-base md:text-xl font-semibold leading-relaxed italic bg-gradient-to-r from-blue-700 via-cyan-500 to-indigo-700 bg-clip-text text-transparent">
          {QUOTE.slice(0, typedLength)}
          <span className="text-blue-600 animate-pulse">|</span>
        </p>
        <p className="mt-2 text-sm md:text-base font-bold text-indigo-700 dark:text-indigo-300">
          — Jose Capablanca
        </p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="block w-full h-[18rem] md:h-[22rem]">
        <polygon
          points={`${trackStartX - 30},${baseY} ${peakX},${peakY} ${width - 22},${baseY}`}
          fill="#0b4b72"
          opacity="0.92"
        />
        <polygon
          points={`${peakX},${peakY} ${width - 22},${baseY} ${peakX + 100},${baseY}`}
          fill="#8ecbdd"
          opacity="0.96"
        />
        <polygon
          points={`${trackStartX + 220},${baseY} ${peakX - 68},${peakY + 62} ${peakX + 22},${peakY + 98} ${trackStartX + 400},${baseY}`}
          fill="#10698b"
          opacity="0.72"
        />

        {LEVEL_SEQUENCE.map((level, index) => {
          const x = trackStartX + index * stepGap;
          const y = baseY - index * stepRise;
          const topY = y - stepDepth;
          const isCurrent = index === selectedIndex;
          const flagColor = isCurrent ? "#dc2626" : "#94a3b8";

          return (
            <g key={level}>
              <polygon
                points={`${x},${y} ${x + stepWidth},${y} ${x + stepWidth + stepSkew},${topY} ${x + stepSkew},${topY}`}
                fill={index % 2 === 0 ? "#0f6e94" : "#1a7ea8"}
              />
              <line
                x1={x + stepWidth - 8}
                y1={topY + 1}
                x2={x + stepWidth - 8}
                y2={topY - 34}
                stroke="#334155"
                strokeWidth="3"
              />
              <polygon
                points={`${x + stepWidth - 8},${topY - 34} ${x + stepWidth + 30},${topY - 24} ${x + stepWidth - 8},${topY - 12}`}
                fill={flagColor}
              />
              <circle
                cx={x + stepWidth - 8}
                cy={topY + 1}
                r={isCurrent ? 10.5 : 7}
                fill={isCurrent ? "#fee2e2" : "#ffffff"}
                stroke={isCurrent ? "#dc2626" : "#60a5fa"}
                strokeWidth={isCurrent ? 3.8 : 2.4}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
});

export default MountainRankChart;
