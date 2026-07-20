import { prisma } from "@/lib/prisma";
import type { TeamMember } from "@prisma/client";

/**
 * The default lead owner at creation time, per Lead Intake v1.2's
 * mandatory-ownership rule ("every lead always has exactly one active
 * owner, defaulting to CEO/Founder"). Returns null rather than throwing if
 * no FOUNDER row exists yet (e.g. seed data hasn't run) - a missing
 * default owner should degrade the lead's ownership, not block the lead
 * from being captured at all. See src/actions/leads.ts for how this is
 * used.
 */
export async function getDefaultOwner(): Promise<TeamMember | null> {
  return prisma.teamMember.findFirst({
    where: { role: "FOUNDER" },
    orderBy: { createdAt: "asc" },
  });
}

/** Every team member, for the owner-reassignment picker on the lead detail page. */
export async function getAllTeamMembers(): Promise<TeamMember[]> {
  return prisma.teamMember.findMany({ orderBy: { name: "asc" } });
}
