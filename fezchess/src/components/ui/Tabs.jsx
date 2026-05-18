import { createContext, useContext, useId, useMemo } from "react";
import { cn } from "../../lib/utils";

const TabsContext = createContext(null);

const Tabs = ({ value, onValueChange, children, className }) => {
  const baseId = useId();
  const ctx = useMemo(
    () => ({ value, setValue: onValueChange, baseId }),
    [value, onValueChange, baseId],
  );
  return (
    <TabsContext.Provider value={ctx}>
      <div className={cn("space-y-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
};

const TabList = ({ children, className }) => (
  <div
    role="tablist"
    className={cn(
      "inline-flex items-center gap-1 rounded-lg border border-border bg-muted p-1",
      className,
    )}
  >
    {children}
  </div>
);

const Tab = ({ value, children, className, ...props }) => {
  const ctx = useContext(TabsContext);
  if (!ctx) return null;
  const active = ctx.value === value;
  return (
    <button
      role="tab"
      type="button"
      aria-selected={active}
      aria-controls={`${ctx.baseId}-panel-${value}`}
      id={`${ctx.baseId}-tab-${value}`}
      onClick={() => ctx.setValue?.(value)}
      data-state={active ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const TabPanel = ({ value, children, className }) => {
  const ctx = useContext(TabsContext);
  if (!ctx) return null;
  if (ctx.value !== value) return null;
  return (
    <div
      role="tabpanel"
      id={`${ctx.baseId}-panel-${value}`}
      aria-labelledby={`${ctx.baseId}-tab-${value}`}
      className={cn("animate-fade-in", className)}
    >
      {children}
    </div>
  );
};

export { Tabs, TabList, Tab, TabPanel };
export default Tabs;
