import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { resolveInterviewLink, markLinkOpened } from "@/features/interviews/server/link-queries";
import { InterviewLanding } from "@/features/interviews/components/candidate/interview-landing";

interface InterviewTokenPageProps {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: "Your Interview",
  robots: { index: false, follow: false },
};

function StatusScreen({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <div className="bg-muted flex size-14 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground size-6" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-xl font-semibold">{title}</h1>
        <p className="text-muted-foreground max-w-sm text-sm text-pretty">{description}</p>
      </div>
    </div>
  );
}

/**
 * No auth, no dashboard shell - candidates never sign in (see
 * InterviewLink's schema comment). Every failure mode gets its own honest
 * message rather than a generic 404, since "this link expired" and
 * "you've already completed this" are very different things to tell
 * someone who just clicked a link from their inbox.
 */
export default async function InterviewTokenPage({ params }: InterviewTokenPageProps) {
  const { token } = await params;
  const resolution = await resolveInterviewLink(token);

  if (resolution.status === "not_found") {
    return (
      <StatusScreen
        icon={AlertTriangle}
        title="This link isn't valid"
        description="Double-check the link you were sent, or reach out to whoever invited you for a new one."
      />
    );
  }

  if (resolution.status === "expired") {
    return (
      <StatusScreen
        icon={AlertTriangle}
        title="This link has expired"
        description="Interview links are only valid for a limited time. Reach out to whoever invited you for a new link."
      />
    );
  }

  if (resolution.status === "completed") {
    return (
      <StatusScreen
        icon={CheckCircle2}
        title="You've already completed this interview"
        description="Thank you - your responses have been recorded. Our recruitment team will review your interview and be in touch."
      />
    );
  }

  await markLinkOpened(token);
  const { candidate } = resolution.link;
  const { job } = candidate;

  return (
    <InterviewLanding
      token={token}
      jobTitle={job.title}
      department={job.department}
      durationMinutes={job.duration}
      candidateName={candidate.name}
    />
  );
}
