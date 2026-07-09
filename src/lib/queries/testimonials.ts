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
