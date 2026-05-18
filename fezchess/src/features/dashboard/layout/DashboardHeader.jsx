import React, { useLayoutEffect } from "react";
import { cn } from "../utils/classNames";
import { useShellTopBarOptional } from "../../../layouts/navigation/shell/ShellTopBarContext";
import { PageHeader } from "../../../components/ui";

/**
 * Tiêu đề dashboard trong nội dung trang (không đẩy lên top bar).
 * Chỉ đăng ký mobileTitle cho thanh mobile.
 */
const DashboardHeader = ({
  eyebrow,
  title,
  subtitle,
  actions,
  filters,
  className,
  hideTitle = false,
}) => {
  const shell = useShellTopBarOptional();
  const setTopBar = shell?.setTopBar;

  useLayoutEffect(() => {
    if (!setTopBar) return undefined;
    const mobileLabel =
      (typeof title === "string" && title) ||
      (typeof eyebrow === "string" && eyebrow) ||
      "";
    setTopBar(mobileLabel ? { mobileTitle: mobileLabel } : null);
    return () => setTopBar(null);
  }, [setTopBar, title, eyebrow]);

  const toolbar = filters || actions;

  if (hideTitle && !toolbar) {
    return null;
  }

  if (hideTitle && toolbar) {
    return (
      <div className={cn("flex justify-end", className)}>{toolbar}</div>
    );
  }

  return (
    <PageHeader
      className={className}
      title={title}
      description={subtitle}
      meta={
        eyebrow ? (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </span>
        ) : null
      }
      actions={toolbar}
    />
  );
};

export default DashboardHeader;
