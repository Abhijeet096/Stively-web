import { prisma } from "@/lib/prisma";
import type { Testimonial } from "@prisma/client";

/**
 * Testimonials shown on the Home page. Published only, manually ordered via
 * `sortOrder` (not creation date) so whoever manages content controls which
 * ones lead - matches the Testimonial model's existing `sortOrder` field.
 */
export async function getFeaturedTestimonials(limit = 6): Promise<Testimonial[]> {
  try {
    return await prisma.testimonial.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
      take: limit,
    });
  } catch (error) {
    console.error("getFeaturedTestimonials failed:", error);
    return [];
  }
}

/**
 * Testimonials scoped to a single program, for Program Detail - per Phase E,
 * shown as a static grid there, not the carousel Home uses. Same
 * catch-and-degrade pattern as the list query above: a program page missing
 * its testimonials section is a minor, acceptable degradation, unlike the
 * program itself failing to load.
 */
export async function getTestimonialsByProgramId(programId: string): Promise<Testimonial[]> {
  try {
    return await prisma.testimonial.findMany({
      where: { programId, published: true },
      orderBy: { sortOrder: "asc" },
    });
  } catch (error) {
    console.error("getTestimonialsByProgramId failed:", error);
    return [];
  }
}
