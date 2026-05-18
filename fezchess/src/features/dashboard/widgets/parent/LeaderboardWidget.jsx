import React, { memo, useMemo } from "react";
import SectionCard from "../../cards/SectionCard";
import EmptyState from "../../cards/EmptyState";
import { LazyMountainRankChart } from "../../charts";
import {
  STUDENT_SKILL_LEVELS,
  getSkillLevelLabel,
} from "../../../../utils/studentLevel";
import { Trophy } from "lucide-react";

const LeaderboardWidget = memo(function LeaderboardWidget({
  child,
  level,
  onLevelChange,
  data,
  loading,
}) {
  const items = data?.items || [];
  const reversedItems = useMemo(() => [...items].reverse(), [items]);

  return (
    <SectionCard
      title="Bảng xếp hạng trung tâm"
      description="Xếp hạng theo 12 cấp độ: Kid 1, Kid 2, Level 1 đến Level 10."
      actions={
        <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
          {child?.fullName || "Học viên"}:{" "}
          {data?.myChildRank
            ? `Hạng #${data.myChildRank}`
            : "Chưa có xếp hạng"}
        </span>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {STUDENT_SKILL_LEVELS.map((lvl) => {
          const active = lvl === level;
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => onLevelChange?.(lvl)}
              className={
                active
                  ? "rounded-full border border-blue-600 bg-blue-600 px-3 py-1 text-xs font-medium text-white"
                  : "rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
              }
            >
              {getSkillLevelLabel(lvl)}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          Đang tải bảng xếp hạng...
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Chưa có xếp hạng"
          description={`Chưa có dữ liệu xếp hạng cho ${getSkillLevelLabel(level)}.`}
        />
      ) : (
        <div className="mb-2">
          <LazyMountainRankChart
            items={reversedItems}
            selectedChildId={child?._id}
          />
        </div>
      )}
    </SectionCard>
  );
});

export default LeaderboardWidget;
