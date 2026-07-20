import type { Metadata } from "next";
import { Newspaper } from "lucide-react";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { EmptyState } from "@/components/sections/empty-state";
import { Container } from "@/components/shared/container";

export const metadata: Metadata = { title: "Blogs" };

/** Placeholder - no blog/CMS backend exists yet (no BlogPost model in prisma/schema.prisma); an honest empty state rather than fabricated post titles. */
export default async function StudentBlogsPage() {
  await requireRole("STUDENT");

  return (
    <>
      <SetPageTitle title="Blogs" />
      <Container className="py-8">
        <EmptyState
          icon={Newspaper}
          title="No blog posts yet"
          description="We'll share articles and guides here once they're published."
        />
      </Container>
    </>
  );
}
