import { z } from "zod";

/**
 * Program.syllabus is stored as untyped Json in the schema (see
 * prisma/schema.prisma comment: "structured module/topic list") - no shape
 * is enforced at the database level. This is where that shape actually gets
 * defined and safely validated, so the UI never has to guess or crash on
 * malformed data.
 */
export const syllabusSchema = z.object({
  modules: z.array(
    z.object({
      title: z.string(),
      topics: z.array(z.string()),
    })
  ),
});

export type Syllabus = z.infer<typeof syllabusSchema>;

/**
 * Returns a valid Syllabus, or null if the stored JSON doesn't match the
 * expected shape - the Curriculum section treats null the same as "no
 * curriculum content yet" (omits itself) rather than crashing the page.
 */
export function parseSyllabus(value: unknown): Syllabus | null {
  const result = syllabusSchema.safeParse(value);
  return result.success ? result.data : null;
}
