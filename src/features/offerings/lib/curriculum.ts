/**
 * Offering.curriculum reuses Program.syllabus's exact shape
 * ({modules: [{title, topics}]}) - re-exported from the existing validator
 * rather than duplicating an identical Zod schema for a second Json field.
 */
export { syllabusSchema as curriculumSchema, parseSyllabus as parseOfferingCurriculum } from "@/lib/validations/program";
export type { Syllabus as OfferingCurriculum } from "@/lib/validations/program";
