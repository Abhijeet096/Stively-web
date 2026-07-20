import type { Metadata } from "next";

import { getAllLearningExperiences, getOfferingsWithoutLearningExperience } from "@/features/learning/server/admin-queries";
import { LearningExperienceList } from "@/features/learning/components/admin/learning-experience-list";
import { CreateLearningExperienceForm } from "@/features/learning/components/admin/create-learning-experience-form";

export const metadata: Metadata = { title: "Learning" };

export default async function AdminLearningPage() {
  const [experiences, offeringsWithoutCurriculum] = await Promise.all([
    getAllLearningExperiences(),
    getOfferingsWithoutLearningExperience(),
  ]);

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Learning</h1>
      </div>

      <CreateLearningExperienceForm offerings={offeringsWithoutCurriculum} />

      <LearningExperienceList experiences={experiences} />
    </div>
  );
}
