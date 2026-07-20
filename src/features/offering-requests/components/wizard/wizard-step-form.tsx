import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { WizardStepConfig } from "../../lib/steps-config";

export interface WizardStepFormProps {
  step: WizardStepConfig;
  values: Record<string, string>;
  error?: string;
  onChange: (name: string, value: string) => void;
}

/**
 * The one renderer both request types share - reads whichever step config
 * steps-config.ts hands it rather than being one of ~10 near-identical
 * step components. Adding a field to any step is a config change here, not
 * a new component.
 */
function WizardStepForm({ step, values, error, onChange }: WizardStepFormProps) {
  return (
    <div className="flex flex-col gap-6">
      {step.description && <p className="text-muted-foreground text-sm">{step.description}</p>}

      {step.fields.map((field) => {
        const value = values[field.name] ?? "";

        return (
          <FormField key={field.name} id={field.name} label={field.label} optional={field.optional}>
            {field.type === "textarea" ? (
              <Textarea
                value={value}
                placeholder={field.placeholder}
                rows={4}
                onChange={(event) => onChange(field.name, event.target.value)}
              />
            ) : field.type === "select" ? (
              <Select value={value || undefined} onValueChange={(v) => onChange(field.name, v)}>
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type={field.type === "tel" ? "tel" : "text"}
                value={value}
                placeholder={field.placeholder}
                onChange={(event) => onChange(field.name, event.target.value)}
              />
            )}
          </FormField>
        );
      })}

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

export { WizardStepForm };
