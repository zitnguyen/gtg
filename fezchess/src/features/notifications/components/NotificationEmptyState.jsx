import React, { memo } from "react";
import { BellOff } from "lucide-react";

const NotificationEmptyState = ({
  title = "Không có thông báo",
  description = "Bạn đã đọc hết tất cả thông báo. Quay lại sau nhé.",
}) => (
  <div className="flex flex-col items-center justify-center px-6 py-12 text-center text-muted-foreground">
    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
      <BellOff size={20} />
    </div>
    <div className="text-sm font-medium text-foreground">{title}</div>
    <div className="text-xs mt-1 max-w-[280px]">{description}</div>
  </div>
);

export default memo(NotificationEmptyState);
