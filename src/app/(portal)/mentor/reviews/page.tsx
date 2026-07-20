import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
import { getMentorByUserId, getSubmissionsForMentorReview } from "@/features/mentors/server/queries";
import { ReviewQueue } from "@/features/mentors/components/mentor/review-queue";

export const metadata: Metadata = { title: "Reviews" };

export default async function MentorReviewsPage() {
  const user = await requireRole("MENTOR");
  const mentor = await getMentorByUserId(user.id);
  const submissions = mentor ? await getSubmissionsForMentorReview(mentor.id) : [];

  return (
    <>
      <SetPageTitle title="Reviews" />
      <Container className="flex flex-col gap-6 py-8">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Reviews</h2>
        <ReviewQueue submissions={submissions} />
      </Container>
    </>
  );
}
