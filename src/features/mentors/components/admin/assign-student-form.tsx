"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import type { User, OfferingEnrollment, Offering } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { assignMentorToStudent } from "../../actions/admin-assignment-actions";

interface AssignStudentFormProps {
  mentorId: string;
  students: User[];
  /** Pre-fetched server-side (server/admin-queries.ts's getStudentEnrollmentsForAssignment, once per candidate student) - a plain query function can't be called from client code, only Server Actions can cross that boundary, so the page resolves this up front instead. */
  enrollmentsByStudent: Record<string, (OfferingEnrollment & { offering: Offering })[]>;
}

function AssignStudentForm({ mentorId, students, enrollmentsByStudent }: AssignStudentFormProps) {
  const router = useRouter();
  const [studentId, setStudentId] = React.useState<string | undefined>();
  const [enrollmentId, setEnrollmentId] = React.useState<string | undefined>();
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const enrollments = studentId ? (enrollmentsByStudent[studentId] ?? []) : [];

  function handleStudentChange(value: string) {
    setStudentId(value);
    setEnrollmentId(undefined);
  }

  if (students.length === 0) return <p className="text-muted-foreground text-sm">Every student is already assigned to this mentor.</p>;

  async function handleAssign() {
    if (!studentId) return;
    setIsPending(true);
    setError(undefined);
    const result = await assignMentorToStudent(mentorId, { studentId, enrollmentId, isPrimary: true });
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setStudentId(undefined);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <FormField id="assign-student" label="Student" className="w-56">
        <Select value={studentId} onValueChange={handleStudentChange}>
          <SelectTrigger id="assign-student">
            <SelectValue placeholder="Choose a student..." />
          </SelectTrigger>
          <SelectContent>
            {students.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField id="assign-enrollment" label="Program" optional className="w-56" helpText="Leave unset for a platform-wide mentor">
        <Select
          value={enrollmentId ?? "__none"}
          onValueChange={(value) => setEnrollmentId(value === "__none" ? undefined : value)}
        >
          <SelectTrigger id="assign-enrollment" disabled={enrollments.length === 0}>
            <SelectValue placeholder="Platform-wide" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">Platform-wide</SelectItem>
            {enrollments.map((enrollment) => (
              <SelectItem key={enrollment.id} value={enrollment.id}>
                {enrollment.offering.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <Button onClick={handleAssign} disabled={!studentId} loading={isPending}>
        Assign
      </Button>
      {error && <p className="text-destructive w-full text-sm">{error}</p>}
    </div>
  );
}

export { AssignStudentForm };
