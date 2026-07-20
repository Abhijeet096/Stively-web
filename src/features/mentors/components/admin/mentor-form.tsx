"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import type { MentorType, TeamMember } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createMentor } from "../../actions/admin-mentor-actions";
import { MENTOR_TYPE_LABEL } from "../../lib/mentor-types";

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function MentorForm({ teamMembers }: { teamMembers: TeamMember[] }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [type, setType] = React.useState<MentorType>("EXTERNAL");
  const [headline, setHeadline] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [expertiseAreas, setExpertiseAreas] = React.useState("");
  const [languages, setLanguages] = React.useState("");
  const [experienceYears, setExperienceYears] = React.useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = React.useState("");
  const [affiliatedTeamMemberId, setAffiliatedTeamMemberId] = React.useState<string | undefined>();
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleSubmit() {
    setIsPending(true);
    setError(undefined);
    const result = await createMentor({
      name,
      email,
      password,
      type,
      headline: headline || undefined,
      bio: bio || undefined,
      expertiseAreas: splitTags(expertiseAreas),
      languages: splitTags(languages),
      experienceYears: experienceYears || undefined,
      profilePhotoUrl: profilePhotoUrl || undefined,
      affiliatedTeamMemberId,
    });
    setIsPending(false);
    if (!result.success || !result.id) {
      setError(result.success ? "Something went wrong." : result.error);
      return;
    }
    router.push(`/admin/mentors/${result.id}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="mentor-name" label="Name">
          <Input id="mentor-name" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField id="mentor-email" label="Email">
          <Input id="mentor-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormField>
        <FormField id="mentor-password" label="Initial password" helpText="Share this with the mentor directly - they can change it after logging in.">
          <Input id="mentor-password" type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormField>
        <FormField id="mentor-type" label="Mentor type">
          <Select value={type} onValueChange={(value) => setType(value as MentorType)}>
            <SelectTrigger id="mentor-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(MENTOR_TYPE_LABEL) as MentorType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {MENTOR_TYPE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField id="mentor-headline" label="Headline" optional>
          <Input id="mentor-headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Senior Engineer at Acme" />
        </FormField>
        <FormField id="mentor-experience" label="Years of experience" optional>
          <Input id="mentor-experience" type="number" min={0} value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} />
        </FormField>
        <FormField id="mentor-photo" label="Profile photo URL" optional>
          <Input id="mentor-photo" value={profilePhotoUrl} onChange={(e) => setProfilePhotoUrl(e.target.value)} />
        </FormField>
        <FormField id="mentor-affiliation" label="Affiliated team member" optional helpText="For internal mentors who are also staff">
          <Select
            value={affiliatedTeamMemberId ?? "__none"}
            onValueChange={(value) => setAffiliatedTeamMemberId(value === "__none" ? undefined : value)}
          >
            <SelectTrigger id="mentor-affiliation">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">None</SelectItem>
              {teamMembers.map((tm) => (
                <SelectItem key={tm.id} value={tm.id}>
                  {tm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <FormField id="mentor-bio" label="Bio" optional>
        <Textarea id="mentor-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
      </FormField>
      <FormField id="mentor-expertise" label="Expertise areas" optional helpText="Comma-separated">
        <Input id="mentor-expertise" value={expertiseAreas} onChange={(e) => setExpertiseAreas(e.target.value)} placeholder="React, System Design, Career Coaching" />
      </FormField>
      <FormField id="mentor-languages" label="Languages" optional helpText="Comma-separated">
        <Input id="mentor-languages" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="English, Hindi" />
      </FormField>

      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button onClick={handleSubmit} loading={isPending} disabled={!name || !email || !password}>
        Create mentor
      </Button>
    </div>
  );
}

export { MentorForm };
