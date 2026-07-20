import { Briefcase, Globe, ExternalLink } from "lucide-react";

import type { Mentor, User } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MentorAvatar } from "../shared/mentor-avatar";
import { ExpertiseTags } from "../shared/expertise-tags";
import { MENTOR_TYPE_LABEL } from "../../lib/mentor-types";
import { socialLinksSchema } from "../../validation/mentor-schemas";

interface MentorProfileViewProps {
  mentor: Mentor & { user: User };
}

function MentorProfileView({ mentor }: MentorProfileViewProps) {
  const socialLinks = socialLinksSchema.safeParse(mentor.socialLinks ?? {});
  const links = socialLinks.success ? socialLinks.data : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-4">
        <MentorAvatar name={mentor.user.name} photoUrl={mentor.profilePhotoUrl} className="size-16" />
        <div className="flex flex-col gap-1">
          <CardTitle className="font-display text-2xl">{mentor.user.name}</CardTitle>
          <CardDescription className="flex items-center gap-1.5">
            <Briefcase className="size-3.5" aria-hidden="true" />
            {mentor.headline ?? MENTOR_TYPE_LABEL[mentor.type]}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {mentor.bio && <p className="text-foreground text-sm text-pretty whitespace-pre-line">{mentor.bio}</p>}

        {mentor.expertiseAreas.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Expertise</span>
            <ExpertiseTags items={mentor.expertiseAreas} />
          </div>
        )}

        {mentor.languages.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Languages</span>
            <ExpertiseTags items={mentor.languages} />
          </div>
        )}

        {mentor.experienceYears != null && (
          <p className="text-muted-foreground text-sm">{mentor.experienceYears} years of experience</p>
        )}

        {links && (links.linkedin || links.website || links.github || links.twitter) && (
          <div className="flex flex-wrap gap-3">
            {links.linkedin && (
              <a href={links.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1.5 text-sm hover:underline">
                <ExternalLink className="size-4" aria-hidden="true" /> LinkedIn
              </a>
            )}
            {links.website && (
              <a href={links.website} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1.5 text-sm hover:underline">
                <Globe className="size-4" aria-hidden="true" /> Website
              </a>
            )}
            {links.github && (
              <a href={links.github} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1.5 text-sm hover:underline">
                <ExternalLink className="size-4" aria-hidden="true" /> GitHub
              </a>
            )}
            {links.twitter && (
              <a href={links.twitter} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1.5 text-sm hover:underline">
                <ExternalLink className="size-4" aria-hidden="true" /> Twitter
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { MentorProfileView };
