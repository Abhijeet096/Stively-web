import { z } from "zod";

/**
 * Offering.curriculum is stored as untyped Json (same reasoning as
 * offeringFaqsSchema in faq.ts) - the admin-authored syllabus plan, keyed
 * by module title so it can be matched against the real Module rows
 * getOfferingCurriculumOutline reads (see course-detail-view.tsx). Used
 * specifically for a module that has no recorded lessons yet: real planned
 * topics instead of either a fabricated lesson breakdown or an empty gap.
 */
const curriculumTopicsSchema = z.object({
  modules: z.array(z.object({ title: z.string(), topics: z.array(z.string()).default([]) })).default([]),
});

/** Returns a title -> topics map, or an empty map if the stored JSON doesn't match. */
export function parseOfferingCurriculumTopics(value: unknown): Map<string, string[]> {
  const result = curriculumTopicsSchema.safeParse(value);
  if (!result.success) return new Map();
  return new Map(result.data.modules.map((module) => [module.title, module.topics]));
}
