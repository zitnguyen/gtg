import React, { memo, useMemo } from "react";
import BlockHeader from "./BlockHeader";
import FieldRenderer from "../forms/FieldRenderer";
import { cn } from "../utils/classNames";

const GROUP_LABELS = {
  buttons: "Nút bấm",
  colors: "Bảng màu",
  typography: "Kiểu chữ",
  trust: "Badge tin cậy",
  media: "Hình ảnh / Video",
};

const groupFields = (fields = []) => {
  const buckets = new Map();
  fields.forEach((field) => {
    const key = field.group || "_main";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(field);
  });
  return buckets;
};

// Generic block renderer. Reads block config from publicCmsSchema and lays
// out fields grouped by `group`. Each block is collapsible so editors can
// keep many sections open without scrolling fatigue.
const BlockRenderer = memo(function BlockRenderer({ block, defaultOpen = true }) {
  const groups = useMemo(() => groupFields(block.fields), [block.fields]);
  const mainFields = groups.get("_main") || [];
  const groupedKeys = Array.from(groups.keys()).filter((k) => k !== "_main");

  return (
    <BlockHeader
      title={block.title}
      subtitle={block.subtitle}
      badge={block.kind}
      defaultOpen={defaultOpen}
    >
      {mainFields.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {mainFields.map((field) => (
            <div
              key={field.key}
              className={cn(field.type === "textarea" && "md:col-span-2")}
            >
              <FieldRenderer field={field} basePath={block.basePath} />
            </div>
          ))}
        </div>
      ) : null}

      {groupedKeys.map((groupKey) => {
        const groupFieldsList = groups.get(groupKey) || [];
        return (
          <div key={groupKey} className="mt-5">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {GROUP_LABELS[groupKey] || groupKey}
              <span className="h-px flex-1 bg-border" />
            </div>
            <div
              className={cn(
                "grid gap-3",
                groupKey === "colors"
                  ? "md:grid-cols-2 lg:grid-cols-3"
                  : "md:grid-cols-2",
              )}
            >
              {groupFieldsList.map((field) => (
                <div
                  key={field.key}
                  className={cn(field.type === "textarea" && "md:col-span-2")}
                >
                  <FieldRenderer field={field} basePath={block.basePath} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </BlockHeader>
  );
});

export default BlockRenderer;
