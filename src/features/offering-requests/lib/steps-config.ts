import type { RequestType } from "@prisma/client";
import { CONTACT_METHOD_OPTIONS } from "./status-labels";

export interface WizardFieldConfig {
  name: string;
  label: string;
  type: "text" | "tel" | "textarea" | "select";
  optional?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface WizardStepConfig {
  key: string;
  title: string;
  description?: string;
  fields: WizardFieldConfig[];
}

/**
 * Fields that live as real OfferingRequest columns (preferredContactMethod,
 * preferredMeetingTime) rather than folded into the flexible `details` Json
 * blob every other field lands in - see request-actions.ts's saveRequestStep,
 * the one place this distinction actually matters.
 */
export const TOP_LEVEL_FIELDS = new Set(["preferredContactMethod", "preferredMeetingTime"]);

/**
 * Minimal by design, per the brief's "do not ask for unnecessary
 * information" - every field earns its place. Config-driven so
 * wizard-step-form.tsx is the only renderer both request types need, not
 * ~10 near-identical step components.
 */
export const STUDENT_STEPS: WizardStepConfig[] = [
  {
    key: "personal-info",
    title: "Personal information",
    fields: [
      { name: "fullName", label: "Full name", type: "text" },
      { name: "phone", label: "Phone number", type: "tel" },
      { name: "city", label: "City", type: "text" },
    ],
  },
  {
    key: "education",
    title: "Education",
    description: "Optional - you can skip this for now.",
    fields: [
      {
        name: "highestQualification",
        label: "Highest qualification",
        type: "select",
        optional: true,
        options: [
          { value: "HIGH_SCHOOL", label: "High school" },
          { value: "DIPLOMA", label: "Diploma" },
          { value: "BACHELORS", label: "Bachelor's degree" },
          { value: "MASTERS", label: "Master's degree" },
          { value: "OTHER", label: "Other" },
        ],
      },
      { name: "fieldOfStudy", label: "Field of study", type: "text", optional: true },
    ],
  },
  {
    key: "career-goal",
    title: "Career goal",
    fields: [
      {
        name: "currentStatus",
        label: "Current status",
        type: "select",
        options: [
          { value: "STUDENT", label: "Student" },
          { value: "WORKING_PROFESSIONAL", label: "Working professional" },
          { value: "BETWEEN_JOBS", label: "Between jobs" },
          { value: "OTHER", label: "Other" },
        ],
      },
      {
        name: "careerGoal",
        label: "What are you hoping to achieve?",
        type: "textarea",
        placeholder: "e.g. Switch into a frontend developer role within a year",
      },
    ],
  },
  {
    key: "schedule",
    title: "Preferred schedule",
    fields: [
      {
        name: "preferredContactMethod",
        label: "Preferred contact method",
        type: "select",
        options: CONTACT_METHOD_OPTIONS,
      },
      {
        name: "preferredMeetingTime",
        label: "Preferred time",
        type: "text",
        placeholder: "e.g. Weekday evenings",
      },
    ],
  },
];

export const BUSINESS_STEPS: WizardStepConfig[] = [
  {
    key: "company",
    title: "Company",
    fields: [
      { name: "companyName", label: "Company name", type: "text" },
      { name: "industry", label: "Industry", type: "text", optional: true },
      {
        name: "companySize",
        label: "Company size",
        type: "select",
        optional: true,
        options: [
          { value: "1-10", label: "1-10 employees" },
          { value: "11-50", label: "11-50 employees" },
          { value: "51-200", label: "51-200 employees" },
          { value: "200+", label: "200+ employees" },
        ],
      },
    ],
  },
  {
    key: "requirement",
    title: "Requirement",
    fields: [
      {
        name: "requirement",
        label: "What do you need built?",
        type: "textarea",
        placeholder: "e.g. A customer-facing web app for booking appointments",
      },
    ],
  },
  {
    key: "budget",
    title: "Budget",
    description: "Optional - a rough range helps us scope faster.",
    fields: [
      {
        name: "budgetRange",
        label: "Budget range",
        type: "select",
        optional: true,
        options: [
          { value: "UNDER_1L", label: "Under ₹1,00,000" },
          { value: "1L_5L", label: "₹1,00,000 - ₹5,00,000" },
          { value: "5L_15L", label: "₹5,00,000 - ₹15,00,000" },
          { value: "15L_PLUS", label: "₹15,00,000+" },
          { value: "NOT_SURE", label: "Not sure yet" },
        ],
      },
    ],
  },
  {
    key: "timeline",
    title: "Timeline",
    fields: [
      {
        name: "timeline",
        label: "When do you need this by?",
        type: "select",
        options: [
          { value: "ASAP", label: "As soon as possible" },
          { value: "WITHIN_A_MONTH", label: "Within a month" },
          { value: "ONE_TO_THREE_MONTHS", label: "1-3 months" },
          { value: "FLEXIBLE", label: "Flexible" },
        ],
      },
    ],
  },
  {
    key: "meeting-preference",
    title: "Meeting preference",
    fields: [
      {
        name: "preferredContactMethod",
        label: "Preferred contact method",
        type: "select",
        options: CONTACT_METHOD_OPTIONS,
      },
      {
        name: "preferredMeetingTime",
        label: "Preferred time",
        type: "text",
        placeholder: "e.g. Weekday afternoons",
      },
    ],
  },
];

export const STEPS_BY_TYPE: Record<RequestType, WizardStepConfig[]> = {
  STUDENT: STUDENT_STEPS,
  BUSINESS: BUSINESS_STEPS,
};

const ALL_STEPS = [...STUDENT_STEPS, ...BUSINESS_STEPS];
export const STEP_BY_KEY = new Map(ALL_STEPS.map((step) => [step.key, step]));

export function getStepIndex(requestType: RequestType, stepKey: string): number {
  return STEPS_BY_TYPE[requestType].findIndex((step) => step.key === stepKey);
}
