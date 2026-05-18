import React, { memo } from "react";
import { User } from "lucide-react";
import SectionCard from "../../cards/SectionCard";
import { getSkillLevelLabel } from "../../../../utils/studentLevel";

const ChildHeaderWidget = memo(function ChildHeaderWidget({ child }) {
  return (
    <SectionCard className="lg:col-span-2 h-full">
      <div className="flex items-start gap-4">
        {child?.avatarUrl ? (
          <img
            src={child.avatarUrl}
            alt={child.fullName}
            className="h-20 w-20 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border bg-muted">
            <User size={28} className="text-blue-600" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl md:text-3xl font-bold text-foreground">
            {child?.fullName || "Học viên"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cấp độ hiện tại
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Mã học viên: {child?.studentId || child?._id || "---"}
          </p>
          <span className="mt-3 inline-flex items-center rounded-full border border-border bg-muted px-3.5 py-1 text-sm font-semibold text-foreground">
            Cấp độ: {getSkillLevelLabel(child?.skillLevel)}
          </span>
        </div>
      </div>
    </SectionCard>
  );
});

export default ChildHeaderWidget;
