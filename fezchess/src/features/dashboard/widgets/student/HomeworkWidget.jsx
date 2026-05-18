import React, { memo } from "react";
import { BookOpen } from "lucide-react";
import SectionCard from "../../cards/SectionCard";

// Placeholder homework widget mirroring the legacy student dashboard. Once
// the homework API exposes per-student progress, swap the static row for a
// dynamic list.
const HomeworkWidget = memo(function HomeworkWidget() {
  return (
    <SectionCard
      title="Bài tập về nhà"
      actions={
        <button
          type="button"
          className="text-sm font-medium text-primary hover:underline"
        >
          Xem tất cả
        </button>
      }
    >
      <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/30">
          <BookOpen size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-foreground">
            Chiếu hết trong 2 nước
          </div>
          <div className="text-sm text-muted-foreground">Đã làm 8/10 câu</div>
        </div>
        <div className="w-[140px]">
          <div className="mb-1 flex justify-end text-xs font-semibold text-blue-600">
            80%
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-blue-600 transition-[width] duration-700"
              style={{ width: "80%" }}
            />
          </div>
        </div>
      </div>
    </SectionCard>
  );
});

export default HomeworkWidget;
