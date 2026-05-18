import React, { memo, useId } from "react";
import FieldShell from "./FieldShell";
import useFieldValue from "../hooks/useFieldValue";

const isValidHex = (value) =>
  typeof value === "string" && /^#?[0-9a-fA-F]{3,8}$/.test(value);

const ColorField = memo(function ColorField({ path, label, hint, placeholder }) {
  const [value, setValue] = useFieldValue(path);
  const id = useId();
  const safeColor = isValidHex(value)
    ? value.startsWith("#")
      ? value
      : `#${value}`
    : "#000000";

  return (
    <FieldShell label={label} hint={hint} htmlFor={id}>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5 transition-colors focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
        <label
          className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md border border-border"
          style={{ background: safeColor }}
        >
          <input
            id={id}
            type="color"
            value={safeColor}
            onChange={(event) => setValue(event.target.value.toUpperCase())}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <input
          value={value || ""}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder || "#000000"}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          spellCheck={false}
        />
      </div>
    </FieldShell>
  );
});

export default ColorField;
