import { z } from "zod";

/**
 * Founder's status-update form on the lead detail page. All fields
 * optional at the schema level since a single submission might only
 * change one of status/priority/followUp - the action decides what
 * actually changed and logs history accordingly (src/actions/crm.ts).
 * lostReason is validated as required only when status is LOST or
 * NOT_INTERESTED via a refine, not a hard-coded field dependency, so this
 * schema stays a plain object rather than a discriminated union for a
 * form where most fields are genuinely independent.
 */
export const updateLeadSchema = z
  .object({
    status: z
      .enum([
        "NEW",
        "ASSIGNED",
        "FIRST_CALL",
        "INTERESTED",
        "CALLBACK_REQUESTED",
        "NOT_RESPONDED",
        "NOT_INTERESTED",
        "COUNSELLING",
        "ENROLLMENT",
        "PAYMENT",
        "INITIAL_CONTACT",
        "WHATSAPP_DISCUSSION",
        "DISCOVERY_CALL",
        "REQUIREMENTS_GATHERING",
        "PROPOSAL_SENT",
        "NEGOTIATION",
        "PROJECT_APPROVED",
        "DEVELOPMENT_STARTED",
        "CONVERTED",
        "LOST",
      ])
      .optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    nextFollowUpAt: z.string().optional(), // date input value (yyyy-mm-dd) or empty string to clear
    // Reclassification for leads the Contact form's earlier bug mis-typed
    // (every enquiry defaulted to STUDENT regardless of what the submitter
    // chose) - new submissions no longer need this, but existing
    // already-created leads do.
    leadType: z.enum(["STUDENT", "BUSINESS"]).optional(),
    companyName: z.string().trim().optional(),
    lostReason: z
      .enum([
        "FINANCIAL_ISSUE",
        "PARENTS_REJECTED",
        "JOINED_ANOTHER_INSTITUTE",
        "NO_TIME",
        "NOT_ELIGIBLE",
        "BUDGET_ISSUE",
        "COMPETITOR_WON",
        "ALREADY_HIRED_AGENCY",
        "INTERNAL_TEAM",
        "POSTPONED",
        "CANCELLED",
        "NO_RESPONSE",
      ])
      .optional(),
  })
  .refine(
    (data) => {
      const isLostStatus = data.status === "LOST" || data.status === "NOT_INTERESTED";
      return !isLostStatus || !!data.lostReason;
    },
    {
      message: "A reason is required when marking a lead LOST or NOT_INTERESTED",
      path: ["lostReason"],
    }
  );

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export const addNoteSchema = z.object({
  leadId: z.string().min(1),
  content: z.string().trim().min(1, "Note can't be empty"),
});

export type AddNoteInput = z.infer<typeof addNoteSchema>;

export const reassignOwnerSchema = z.object({
  leadId: z.string().min(1),
  newOwnerId: z.string().min(1, "Choose a team member"),
  reason: z.enum(["SLA_BREACH", "UNAVAILABLE", "MANUAL_OVERRIDE"]),
});

export type ReassignOwnerInput = z.infer<typeof reassignOwnerSchema>;
