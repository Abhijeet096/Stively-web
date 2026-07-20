"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import type { Mentor } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { updateOwnProfile } from "../../actions/profile-actions";

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function EditProfileForm({ mentor }: { mentor: Mentor }) {
  const router = useRouter();
  const [headline, setHeadline] = React.useState(mentor.headline ?? "");
  const [bio, setBio] = React.useState(mentor.bio ?? "");
  const [expertiseAreas, setExpertiseAreas] = React.useState(mentor.expertiseAreas.join(", "));
  const [languages, setLanguages] = React.useState(mentor.languages.join(", "));
  const [experienceYears, setExperienceYears] = React.useState(mentor.experienceYears?.toString() ?? "");
  const [profilePhotoUrl, setProfilePhotoUrl] = React.useState(mentor.profilePhotoUrl ?? "");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [saved, setSaved] = React.useState(false);

  async function handleSubmit() {
    setIsPending(true);
    setError(undefined);
    setSaved(false);
    const result = await updateOwnProfile({
      type: mentor.type,
      headline: headline || undefined,
      bio: bio || undefined,
      expertiseAreas: splitTags(expertiseAreas),
      languages: splitTags(languages),
      experienceYears: experienceYears || undefined,
      profilePhotoUrl: profilePhotoUrl || undefined,
    });
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <FormField id="edit-headline" label="Headline" optional>
        <Input id="edit-headline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
      </FormField>
      <FormField id="edit-bio" label="Bio" optional>
        <Textarea id="edit-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
      </FormField>
      <FormField id="edit-expertise" label="Expertise areas" optional helpText="Comma-separated">
        <Input id="edit-expertise" value={expertiseAreas} onChange={(e) => setExpertiseAreas(e.target.value)} />
      </FormField>
      <FormField id="edit-languages" label="Languages" optional helpText="Comma-separated">
        <Input id="edit-languages" value={languages} onChange={(e) => setLanguages(e.target.value)} />
      </FormField>
      <FormField id="edit-experience" label="Years of experience" optional>
        <Input id="edit-experience" type="number" min={0} value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} />
      </FormField>
      <FormField id="edit-photo" label="Profile photo URL" optional>
        <Input id="edit-photo" value={profilePhotoUrl} onChange={(e) => setProfilePhotoUrl(e.target.value)} />
      </FormField>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {saved && !error && <p className="text-success text-sm">Saved.</p>}
      <Button onClick={handleSubmit} loading={isPending} className="w-fit">
        Save changes
      </Button>
    </div>
  );
}

export { EditProfileForm };
