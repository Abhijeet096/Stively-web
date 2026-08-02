import { z } from "zod";
import { PortfolioCategory } from "@prisma/client";

const featureSchema = z.object({
  title: z.string().trim().min(1, "Feature title is required"),
  description: z.string().trim().min(1, "Feature description is required"),
});

const outcomeSchema = z.object({
  label: z.string().trim().min(1, "Outcome label is required"),
  value: z.string().trim().min(1, "Outcome value is required"),
});

/**
 * The admin create/edit shape for PortfolioItem. Every case-study narrative
 * field (challenge/solution/features/techStack/outcomes/mockupImages/
 * galleryImages) is optional - this codebase never fabricates placeholder
 * content, so a project with no real case-study material yet simply omits
 * those sections rather than shipping empty/fake ones (see PortfolioItem's
 * own schema comment). `.partial()` below covers edit, where every field
 * may be submitted unchanged rather than required fresh each time.
 */
export const portfolioItemSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, hyphen-separated"),
  title: z.string().trim().min(1, "Title is required"),
  tagline: z.string().trim().optional(),
  clientName: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  category: z.nativeEnum(PortfolioCategory).default("WEBSITE"),
  summary: z.string().trim().min(1, "Summary is required"),

  challenge: z.string().trim().optional(),
  solution: z.string().trim().optional(),
  features: z.array(featureSchema).default([]),
  techStack: z.array(z.string()).default([]),
  outcomes: z.array(outcomeSchema).default([]),

  imageUrl: z.string().trim().url("Cover image is required"),
  mockupImages: z.array(z.string().trim().url()).default([]),
  galleryImages: z.array(z.string().trim().url()).default([]),
  liveUrl: z.union([z.string().trim().url("Enter a valid URL"), z.literal("")]).optional(),
  tags: z.array(z.string()).default([]),

  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updatePortfolioItemSchema = portfolioItemSchema.partial().extend({
  id: z.string(),
});

export type PortfolioItemInput = z.infer<typeof portfolioItemSchema>;
export type UpdatePortfolioItemInput = z.infer<typeof updatePortfolioItemSchema>;
export type PortfolioFeatureInput = z.infer<typeof featureSchema>;
export type PortfolioOutcomeInput = z.infer<typeof outcomeSchema>;
