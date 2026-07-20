import { z } from "zod";
import { OfferingAudience, OfferingCategory, OfferingStatus, PricingType, Difficulty, Mode } from "@prisma/client";

import { offeringFaqsSchema } from "../lib/faq";
import { curriculumSchema } from "../lib/curriculum";

/**
 * The full Offering create/edit shape - prepared for the Admin CMS this
 * phase deliberately doesn't build (see the brief's "Admin Preparation"
 * section). Not called from any UI yet; exists so the actions in
 * ../actions/offering-admin-actions.ts have a real, enforced contract to
 * validate against the moment a CMS form starts submitting to them.
 */
export const offeringAdminSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, hyphen-separated"),
  title: z.string().trim().min(1, "Title is required"),
  shortDescription: z.string().trim().min(1, "Short description is required"),
  longDescription: z.string().trim().min(1, "Long description is required"),
  category: z.nativeEnum(OfferingCategory),
  audience: z.nativeEnum(OfferingAudience),
  status: z.nativeEnum(OfferingStatus).default("DRAFT"),
  featured: z.boolean().default(false),
  visible: z.boolean().default(true),

  price: z.number().int().nonnegative().nullable().optional(),
  currency: z.string().trim().default("INR"),
  discountPrice: z.number().int().nonnegative().nullable().optional(),
  pricingType: z.nativeEnum(PricingType).default("FIXED"),
  duration: z.string().trim().optional(),
  mode: z.nativeEnum(Mode).default("ONLINE"),
  difficulty: z.nativeEnum(Difficulty).optional(),
  capacity: z.number().int().positive().optional(),

  whatYoullLearn: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  whoItsFor: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  faqs: offeringFaqsSchema.optional(),
  curriculum: curriculumSchema.optional(),

  thumbnailUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  gallery: z.array(z.string().url()).default([]),

  instructorName: z.string().trim().optional(),
  tags: z.array(z.string()).default([]),

  metaTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
  keywords: z.array(z.string()).default([]),
});

export type OfferingAdminInput = z.infer<typeof offeringAdminSchema>;
