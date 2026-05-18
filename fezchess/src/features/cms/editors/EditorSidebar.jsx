import React, { memo } from "react";
import {
  Home,
  Palette,
  GraduationCap,
  Newspaper,
  Phone,
  Users,
} from "lucide-react";
import useEditorStore from "../hooks/useEditorStore";
import { cn } from "../utils/classNames";

const ICON_MAP = {
  theme: Palette,
  home: Home,
  courseStore: GraduationCap,
  teachersPage: Users,
  newsPage: Newspaper,
  contactPage: Phone,
};

// Vertical navigation between CMS tabs. Each item shows a dirty indicator
// when its section has unsaved edits, so the editor knows where work is in
// progress without scrolling.
const EditorSidebar = memo(function EditorSidebar({
  tabs,
  activeTab,
  onSelect,
}) {
  const dirtyPaths = useEditorStore((state) => state.dirtyPaths);

  return (
    <nav className="flex flex-col gap-1.5">
      {tabs.map((tab) => {
        const Icon = ICON_MAP[tab.id] || Palette;
        const dirty = dirtyPaths.has(tab.id);
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect?.(tab.id)}
            className={cn(
              "flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
              active
                ? "border-primary/30 bg-primary/5 text-foreground"
                : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                active
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-muted/40",
              )}
            >
              <Icon size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {tab.label}
                {dirty ? (
                  <span
                    aria-label="Có thay đổi chưa lưu"
                    className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500"
                  />
                ) : null}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                {tab.description}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
});

export default EditorSidebar;
