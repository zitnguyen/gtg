import { cloneElement, isValidElement, useId } from "react";
import { cn } from "../../lib/utils";
import Label from "./Label";

/**
 * Field — wrapper chuẩn cho 1 control:
 *   <Field label="Email" required hint="Dùng email công ty" error={errors.email}>
 *     <Input ... />
 *   </Field>
 *
 * Tự gắn id + aria-describedby giữa control và hint/error.
 */
const Field = ({
  label,
  hint,
  error,
  required,
  htmlFor,
  className,
  children,
}) => {
  const autoId = useId();
  const id = htmlFor || autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const enhancedChild = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id || id,
        "aria-describedby":
          children.props["aria-describedby"] || describedBy,
        "aria-invalid":
          error ? "true" : children.props["aria-invalid"],
      })
    : children;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      ) : null}
      {enhancedChild}
      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export { Field };
export default Field;
