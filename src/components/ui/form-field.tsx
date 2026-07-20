import * as React from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export interface FormFieldProps {
  id: string;
  label: string;
  /** Marks the field as optional in the label instead of marking every required field - see design-system.md §13 */
  optional?: boolean;
  helpText?: string;
  error?: string;
  className?: string;
  children: React.ReactElement<{
    id?: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
  }>;
}

/**
 * Wraps a single Input/Textarea with its label and help-or-error text,
 * wiring the ARIA attributes screen readers need automatically. Error text
 * replaces help text rather than showing both at once (design-system.md §13).
 */
function FormField({ id, label, optional, helpText, error, className, children }: FormFieldProps) {
  const describedById = error ? `${id}-error` : helpText ? `${id}-help` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {optional && <span className="text-muted-foreground ml-1 font-normal">(optional)</span>}
      </Label>

      {React.cloneElement(children, {
        id,
        "aria-invalid": !!error,
        "aria-describedby": describedById,
      })}

      {error ? (
        <p id={`${id}-error`} role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : helpText ? (
        <p id={`${id}-help`} className="text-muted-foreground text-sm">
          {helpText}
        </p>
      ) : null}
    </div>
  );
}

export { FormField };
