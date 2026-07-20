import { z } from "zod";
import { MentorType } from "@prisma/client";

/** { linkedin?, twitter?, website?, github? } - the Mentor.socialLinks Json payload. */
export const socialLinksSchema = z.object({
  linkedin: z.string().trim().url().optional().or(z.literal("")),
  twitter: z.string().trim().url().optional().or(z.literal("")),
  website: z.string().trim().url().optional().or(z.literal("")),
  github: z.string().trim().url().optional().or(z.literal("")),
});
export type SocialLinksInput = z.infer<typeof socialLinksSchema>;

const weeklySlotSchema = z.object({
  day: z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]),
  startTime: z.string().trim().min(1),
  endTime: z.string().trim().min(1),
});

/** { timezone, weeklySlots } - the Mentor.availability Json payload. Descriptive only, no booking-conflict engine reads this. */
export const availabilitySchema = z.object({
  timezone: z.string().trim().min(1),
  weeklySlots: z.array(weeklySlotSchema).default([]),
});
export type AvailabilityInput = z.infer<typeof availabilitySchema>;

export const mentorProfileFormSchema = z.object({
  type: z.nativeEnum(MentorType),
  headline: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  expertiseAreas: z.array(z.string().trim().min(1)).default([]),
  languages: z.array(z.string().trim().min(1)).default([]),
  experienceYears: z.coerce.number().int().min(0).optional(),
  profilePhotoUrl: z.string().trim().url().optional().or(z.literal("")),
  affiliatedTeamMemberId: z.string().trim().optional(),
});
export type MentorProfileFormInput = z.infer<typeof mentorProfileFormSchema>;

/**
 * Admin-provisioned account creation - MENTOR is explicitly not on the
 * public /register form (src/config/rbac.ts's Role comment: "assigned
 * internally by an admin"), and this codebase has no email-invite
 * infrastructure to send a real invite link through. The admin sets an
 * initial password directly and communicates it out-of-band; the existing
 * "Forgot password?" flow (src/actions/auth.ts) is the mentor's real path
 * to a password only they know.
 */
export const createMentorFormSchema = mentorProfileFormSchema.extend({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must include at least one letter")
    .regex(/[0-9]/, "Password must include at least one number"),
});
export type CreateMentorFormInput = z.infer<typeof createMentorFormSchema>;
