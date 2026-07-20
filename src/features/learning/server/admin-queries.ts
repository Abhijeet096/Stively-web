import "server-only";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/** For /admin/learning's list - every LearningExperience with its Offering, plus a cheap lesson count. */
export async function getAllLearningExperiences() {
  const experiences = await prisma.learningExperience.findMany({
    include: {
      offering: true,
      modules: { select: { id: true, lessons: { select: { id: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return experiences.map((experience) => ({
    ...experience,
    moduleCount: experience.modules.length,
    lessonCount: experience.modules.reduce((sum, m) => sum + m.lessons.length, 0),
  }));
}

/** Offerings that don't have a LearningExperience yet - for the "create curriculum for..." picker. */
export async function getOfferingsWithoutLearningExperience() {
  return prisma.offering.findMany({
    where: { learningExperience: null },
    orderBy: { title: "asc" },
  });
}

const adminLearningExperienceInclude = {
  offering: true,
  modules: {
    include: {
      lessons: {
        include: {
          blocks: { include: { resource: true, assessment: true, liveSession: true }, orderBy: { order: "asc" } },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  },
} satisfies Prisma.LearningExperienceInclude;

export type LearningExperienceForAdmin = Prisma.LearningExperienceGetPayload<{
  include: typeof adminLearningExperienceInclude;
}>;

/** Full curriculum tree (modules -> lessons -> blocks, with block relations resolved) for the admin editor. */
export async function getLearningExperienceForAdmin(id: string): Promise<LearningExperienceForAdmin | null> {
  return prisma.learningExperience.findUnique({
    where: { id },
    include: adminLearningExperienceInclude,
  });
}

export async function getAllResources() {
  return prisma.resource.findMany({ orderBy: { title: "asc" } });
}
