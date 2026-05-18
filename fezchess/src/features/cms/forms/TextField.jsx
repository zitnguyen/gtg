import React, { memo, useId } from "react";
import FieldShell from "./FieldShell";
import useFieldValue from "../hooks/useFieldValue";
import { cn } from "../utils/classNames";

const TextField = memo(function TextField({
  path,
  label,
  placeholder,
  hint,
  className,
}) {
  const [value, setValue] = useFieldValue(path);
  const id = useId();

  return (
    <FieldShell label={label} hint={hint} htmlFor={id}>
      <input
        id={id}
        value={value || ""}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60",
          "transition-colors focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20",
          className,
        )}
      />
    </FieldShell>
  );
});

export default TextField;
