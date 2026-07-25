"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { InterviewTemplate } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createJob, updateJob } from "../../actions/admin-job-actions";
import type { JobWithTemplate } from "../../server/queries";

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export interface JobFormProps {
  templates: InterviewTemplate[];
  /** Present for edit, absent for create. */
  job?: JobWithTemplate;
}

function JobForm({ templates, job }: JobFormProps) {
  const router = useRouter();
  const isEdit = !!job;

  const [title, setTitle] = React.useState(job?.title ?? "");
  const [department, setDepartment] = React.useState(job?.department ?? "");
  const [description, setDescription] = React.useState(job?.description ?? "");
  const [experience, setExperience] = React.useState(job?.experience ?? "");
  const [skills, setSkills] = React.useState(job?.skills.join(", ") ?? "");
  const [templateId, setTemplateId] = React.useState(job?.templateId ?? templates[0]?.id ?? "");
  const [duration, setDuration] = React.useState(String(job?.duration ?? 20));
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleSubmit() {
    setIsPending(true);
    setError(undefined);

    const input = {
      title,
      department,
      description,
      experience,
      skills: splitTags(skills),
      templateId,
      duration,
    };

    if (isEdit) {
      const result = await updateJob(job.id, input);
      setIsPending(false);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/admin/interviews/jobs/${job.id}`);
    } else {
      const result = await createJob(input);
      setIsPending(false);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/admin/interviews/jobs/${result.id}`);
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="job-title" label="Job title">
          <Input id="job-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sales Executive" />
        </FormField>
        <FormField id="job-department" label="Department">
          <Input id="job-department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Sales" />
        </FormField>
        <FormField id="job-experience" label="Experience level">
          <Input id="job-experience" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="1-3 years" />
        </FormField>
        <FormField id="job-duration" label="Interview duration (minutes)">
          <Input id="job-duration" type="number" min={5} max={120} value={duration} onChange={(e) => setDuration(e.target.value)} />
        </FormField>
        <FormField id="job-template" label="Interview template" helpText="Determines the AI interviewer's persona, goals, and evaluation rubric.">
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger id="job-template">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <FormField id="job-description" label="Description">
        <Textarea id="job-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
      </FormField>
      <FormField id="job-skills" label="Skills" helpText="Comma-separated">
        <Input id="job-skills" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Communication, Negotiation, CRM tools" />
      </FormField>

      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button
        onClick={handleSubmit}
        loading={isPending}
        disabled={!title || !department || !description.trim() || !experience || !templateId}
      >
        {isEdit ? "Save changes" : "Create job"}
      </Button>
    </div>
  );
}

export { JobForm };
