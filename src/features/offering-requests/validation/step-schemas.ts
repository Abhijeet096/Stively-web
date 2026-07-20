import { z } from "zod";
import type { RequestType } from "@prisma/client";

import {
  STUDENT_STEPS,
  BUSINESS_STEPS,
  STEP_BY_KEY,
  STEPS_BY_TYPE,
  type WizardStepConfig,
} from "../lib/steps-config";

/**
 * One Zod primitive per field name - the single source of truth for what
 * makes each field valid. steps-config.ts's field list decides which of
 * these apply to a given step and whether it's optional there; the rule
 * itself lives here, once, not duplicated per step.
 */
const FIELD_SCHEMAS: Record<string, z.ZodTypeAny> = {
  fullName: z.string().trim().min(2, "Enter your full name"),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
  city: z.string().trim().min(1, "Enter your city"),
  highestQualification: z.enum(["HIGH_SCHOOL", "DIPLOMA", "BACHELORS", "MASTERS", "OTHER"]),
  fieldOfStudy: z.string().trim().min(1, "Enter a field of study"),
  currentStatus: z.enum(["STUDENT", "WORKING_PROFESSIONAL", "BETWEEN_JOBS", "OTHER"]),
  careerGoal: z.string().trim().min(10, "Tell us a little more - at least 10 characters"),
  preferredContactMethod: z.enum(["EMAIL", "PHONE", "WHATSAPP", "GOOGLE_MEET", "ZOOM"]),
  preferredMeetingTime: z.string().trim().min(1, "Let us know a preferred time"),
  companyName: z.string().trim().min(1, "Company name is required"),
  industry: z.string().trim().min(1, "Enter an industry"),
  companySize: z.enum(["1-10", "11-50", "51-200", "200+"]),
  requirement: z.string().trim().min(10, "Tell us a little more - at least 10 characters"),
  budgetRange: z.enum(["UNDER_1L", "1L_5L", "5L_15L", "15L_PLUS", "NOT_SURE"]),
  timeline: z.enum(["ASAP", "WITHIN_A_MONTH", "ONE_TO_THREE_MONTHS", "FLEXIBLE"]),
};

function buildStepSchema(step: WizardStepConfig) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of step.fields) {
    const base = FIELD_SCHEMAS[field.name];
    shape[field.name] = field.optional ? base.optional() : base;
  }
  return z.object(shape);
}

const STEP_SCHEMAS = new Map(
  [...STUDENT_STEPS, ...BUSINESS_STEPS].map((step) => [step.key, buildStepSchema(step)])
);

export type StepValidationResult =
  | { success: true; data: Record<string, string> }
  | { success: false; error: string };

/**
 * Validates one wizard step's raw field values against its schema. Empty
 * strings on optional fields are dropped before validation (an unset
 * optional Select still posts `""`, not `undefined`, from a native form) -
 * every other rule is enforced exactly as FIELD_SCHEMAS defines it.
 */
export function validateStep(stepKey: string, raw: Record<string, string>): StepValidationResult {
  const step = STEP_BY_KEY.get(stepKey);
  const schema = STEP_SCHEMAS.get(stepKey);
  if (!step || !schema) {
    return { success: false, error: "Unknown step" };
  }

  const cleaned: Record<string, string> = {};
  for (const field of step.fields) {
    const value = raw[field.name]?.trim() ?? "";
    if (value === "" && field.optional) continue;
    cleaned[field.name] = value;
  }

  const result = schema.safeParse(cleaned);
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message ?? "Please check your details." };
  }
  return { success: true, data: result.data as Record<string, string> };
}

/**
 * Re-validates every step for a request type against the fully merged data
 * at submit time - defense in depth against a client that reaches the
 * Review step without ever actually saving an earlier one (a manipulated
 * request, a resumed draft from before a step was added, etc.). The wizard
 * UI already prevents this in the normal flow; this is the server not
 * trusting that it did.
 */
export function validateAllSteps(
  requestType: RequestType,
  merged: Record<string, unknown>
): { success: true } | { success: false; error: string; stepKey: string } {
  for (const step of STEPS_BY_TYPE[requestType]) {
    const raw: Record<string, string> = {};
    for (const field of step.fields) {
      const value = merged[field.name];
      raw[field.name] = typeof value === "string" ? value : "";
    }
    const result = validateStep(step.key, raw);
    if (!result.success) {
      return { success: false, error: result.error, stepKey: step.key };
    }
  }
  return { success: true };
}
