import React, { memo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import SectionCard from "../../cards/SectionCard";

const CircleProgress = ({ percent }) => {
  const safe = Math.max(0, Math.min(100, Number(percent) || 0));
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;

  return (
    <div className="relative h-32 w-32">
      <svg className="h-32 w-32 -rotate-90" aria-hidden="true">
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="rgb(var(--border-rgb, 229 231 235))"
          strokeWidth="10"
          fill="none"
          className="stroke-muted"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-blue-600 transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground tabular-nums">
          {safe}%
        </span>
        <span className="mt-0.5 text-xs text-muted-foreground">Hoàn thành</span>
      </div>
    </div>
  );
};

const ProgressCircleWidget = memo(function ProgressCircleWidget({
  percent,
  completedLessons,
  totalLessons,
  childId,
}) {
  return (
    <SectionCard
      className="h-full"
      title="Tiến độ học tập"
      actions={
        <Link
          to={`/parent/progress?studentId=${childId}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronRight size={18} />
        </Link>
      }
    >
      <div className="flex flex-col items-center justify-center gap-3 py-2">
        <CircleProgress percent={percent} />
        <div className="text-base font-semibold text-foreground">
          {completedLessons} / {totalLessons} buổi
        </div>
        <Link
          to={`/parent/progress?studentId=${childId}`}
          className="text-sm text-primary hover:underline"
        >
          Xem chi tiết
        </Link>
      </div>
    </SectionCard>
  );
});

export default ProgressCircleWidget;
