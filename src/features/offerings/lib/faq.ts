import { z } from "zod";

/**
 * Offering.faqs is stored as untyped Json (see prisma/schema.prisma) - same
 * reasoning as Program.syllabus/parseSyllabus (src/lib/validations/program.ts):
 * no shape is enforced at the database level, so this is where it actually
 * gets validated before the UI trusts it.
 */
export const offeringFaqsSchema = z.array(
  z.object({
    question: z.string(),
    answer: z.string(),
  })
);

export type OfferingFaqs = z.infer<typeof offeringFaqsSchema>;

/** Returns validated FAQs, or an empty array if the stored JSON doesn't match - the FAQ section omits itself rather than crashing the page. */
export function parseOfferingFaqs(value: unknown): OfferingFaqs {
  const result = offeringFaqsSchema.safeParse(value);
  return result.success ? result.data : [];
}
