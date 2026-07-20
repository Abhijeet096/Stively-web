import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/sections/empty-state";
import { User } from "lucide-react";
import { getMentorByUserId } from "@/features/mentors/server/queries";
import { EditProfileForm } from "@/features/mentors/components/mentor/edit-profile-form";

export const metadata: Metadata = { title: "My Profile" };

export default async function MentorProfilePage() {
  const user = await requireRole("MENTOR");
  const mentor = await getMentorByUserId(user.id);

  return (
    <>
      <SetPageTitle title="My Profile" />
      <Container className="py-8">
        {mentor ? (
          <Card>
            <CardHeader>
              <CardTitle>Edit profile</CardTitle>
            </CardHeader>
            <CardContent>
              <EditProfileForm mentor={mentor} />
            </CardContent>
          </Card>
        ) : (
          <EmptyState icon={User} title="Profile not set up" description="Contact an admin to finish setting up your mentor profile." />
        )}
      </Container>
    </>
  );
}
