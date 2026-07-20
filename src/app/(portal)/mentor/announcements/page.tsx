import type { Metadata } from "next";
import { Megaphone } from "lucide-react";

import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/sections/empty-state";
import { getMentorByUserId } from "@/features/mentors/server/queries";
import { AnnouncementForm } from "@/features/mentors/components/mentor/announcement-form";

export const metadata: Metadata = { title: "Announcements" };

export default async function MentorAnnouncementsPage() {
  const user = await requireRole("MENTOR");
  const mentor = await getMentorByUserId(user.id);
  const announcements = mentor
    ? await prisma.mentorAnnouncement.findMany({ where: { mentorId: mentor.id }, orderBy: { createdAt: "desc" } })
    : [];

  return (
    <>
      <SetPageTitle title="Announcements" />
      <Container className="flex flex-col gap-8 py-8">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Announcements</h2>

        <Card>
          <CardHeader>
            <CardTitle>New announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <AnnouncementForm />
          </CardContent>
        </Card>

        {announcements.length === 0 ? (
          <EmptyState icon={Megaphone} title="No announcements yet" description="Announcements you post will show up here." />
        ) : (
          <div className="flex flex-col gap-3">
            {announcements.map((announcement) => (
              <Card key={announcement.id}>
                <CardHeader>
                  <CardTitle className="text-base">{announcement.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-1">
                  <p className="text-foreground text-sm whitespace-pre-line">{announcement.content}</p>
                  <span className="text-muted-foreground text-xs">
                    {announcement.createdAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
