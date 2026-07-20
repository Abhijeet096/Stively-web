import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getLearningExperienceForAdmin, getAllResources } from "@/features/learning/server/admin-queries";
import { prisma } from "@/lib/prisma";
import { CurriculumTree } from "@/features/learning/components/admin/curriculum-tree";
import { Button } from "@/components/ui/button";

interface AdminLearningExperiencePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AdminLearningExperiencePageProps): Promise<Metadata> {
  const { id } = await params;
  const experience = await getLearningExperienceForAdmin(id);
  return { title: experience ? (experience.title ?? experience.offering.title) : "Learning" };
}

export default async function AdminLearningExperiencePage({ params }: AdminLearningExperiencePageProps) {
  const { id } = await params;

  const [experience, resources, assessments, liveSessions] = await Promise.all([
    getLearningExperienceForAdmin(id),
    getAllResources(),
    prisma.assessment.findMany({ orderBy: { title: "asc" } }),
    prisma.liveSession.findMany({ where: { learningExperienceId: id }, orderBy: { title: "asc" } }),
  ]);

  if (!experience) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/learning" aria-label="Back to Learning">
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
        </Button>
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            {experience.title ?? experience.offering.title}
          </h1>
          <p className="text-muted-foreground text-sm">{experience.offering.title}</p>
        </div>
      </div>

      <CurriculumTree
        learningExperience={experience}
        resources={resources}
        assessments={assessments}
        liveSessions={liveSessions}
      />
    </div>
  );
}
