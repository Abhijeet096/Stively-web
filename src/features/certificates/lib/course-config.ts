/**
 * The one place a course's certificate identity is configured - adding
 * certificates to a future course is one new entry here, never a schema
 * change or new code path. Keyed by Offering.slug since that's the stable,
 * human-chosen identifier every course already has.
 */
export interface CourseCertificateConfig {
  /** Short code used in the public certificate number, e.g. "STV-GAI-2026-000001". */
  prefix: string;
  /** The course name snapshotted onto every certificate issued for this course - independent of the Offering's own title, so a later course rename never rewrites history. */
  courseName: string;
  /** The formal, certificate-register description printed under the course name - distinct from the marketing shortDescription used elsewhere, since a certificate reads differently than an ad. */
  description: string;
}

export const COURSE_CERTIFICATE_CONFIG: Record<string, CourseCertificateConfig> = {
  "generative-ai-prompt-engineering": {
    prefix: "GAI",
    courseName: "Generative AI & Prompt Engineering Certification Course",
    description:
      "This certifies the successful completion of a comprehensive program covering Generative AI tools, prompt engineering, AI workflows, real-world applications and hands-on projects, demonstrating practical skills for the modern AI era.",
  },
};

/** Null means this course doesn't issue certificates (yet) - callers must treat that as "not eligible," never fall back to a guessed prefix. */
export function getCourseCertificateConfig(offeringSlug: string): CourseCertificateConfig | null {
  return COURSE_CERTIFICATE_CONFIG[offeringSlug] ?? null;
}
