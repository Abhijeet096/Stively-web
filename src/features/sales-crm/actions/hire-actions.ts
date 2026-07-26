"use server";

import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { hashPassword } from "@/lib/password";
import type { ActionResult } from "@/actions/leads";

export type HireResult = ActionResult & { temporaryPassword?: string; email?: string };

/** 12 URL-safe characters - typeable, shown once to the admin who then shares it with the new hire out of band. */
function generateTemporaryPassword(): string {
  return crypto.randomBytes(9).toString("base64url");
}

/**
 * Provisions a real, login-capable Sales Executive account from a
 * candidate who passed their AI interview: a User (Role.SALES), a linked
 * TeamMember (SALESPERSON), and a SalesProfile carrying their commission
 * rate. A random temporary password is generated and returned once - it's
 * never stored in plaintext or logged, only the bcrypt hash is persisted.
 */
export async function hireAsSalesPerson(candidateId: string, commissionPercentage: number): Promise<HireResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");

  if (!Number.isFinite(commissionPercentage) || commissionPercentage < 0 || commissionPercentage > 100) {
    return { success: false, error: "Commission percentage must be between 0 and 100." };
  }

  try {
    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) return { success: false, error: "Candidate not found." };

    const existingUser = await prisma.user.findUnique({ where: { email: candidate.email }, include: { teamMember: true } });
    if (existingUser) {
      if (existingUser.teamMember) return { success: false, error: "This candidate has already been hired." };
      return { success: false, error: "A user account with this email already exists - link them to a team member manually." };
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: candidate.name,
          email: candidate.email,
          password: passwordHash,
          role: "SALES",
          passwordChangedAt: new Date(),
        },
      });
      const teamMember = await tx.teamMember.create({
        data: { name: candidate.name, email: candidate.email, role: "SALESPERSON", userId: user.id },
      });
      await tx.salesProfile.create({
        data: { teamMemberId: teamMember.id, commissionPercentage },
      });
    });

    return { success: true, temporaryPassword, email: candidate.email };
  } catch (error) {
    console.error("hireAsSalesPerson failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/** Whether this candidate has already been hired as a sales person - keyed on email, the natural join between Candidate and User. */
export async function getHireStatusForCandidate(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { email }, include: { teamMember: true } });
  return !!user?.teamMember;
}
