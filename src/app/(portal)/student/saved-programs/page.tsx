import type { Metadata } from "next";
import { Bookmark } from "lucide-react";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { EmptyState } from "@/components/sections/empty-state";
import { Container } from "@/components/shared/container";

export const metadata: Metadata = { title: "Saved Programs" };

/** Placeholder - bookmarking a Program isn't modeled yet (no SavedProgram relation on User); this is the nav destination the dashboard home's "Saved Programs" section already links out to. */
export default async function SavedProgramsPage() {
  await requireRole("STUDENT");

  return (
    <>
      <SetPageTitle title="Saved Programs" />
      <Container className="py-8">
        <EmptyState
          icon={Bookmark}
          title="No saved programs yet"
          description="You haven't saved any training programs yet."
          actionLabel="Browse Training"
          actionHref="/training"
        />
      </Container>
    </>
  );
}
