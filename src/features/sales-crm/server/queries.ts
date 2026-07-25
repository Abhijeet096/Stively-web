import "server-only";

import { prisma } from "@/lib/prisma";
import type { Prisma, SalesLead, SalesLeadStatus, SalesLeadSource, LeadPriority, TeamMember, SalesLeadActivity, SalesLeadNote } from "@prisma/client";
import type { SalesCrmViewer } from "./rbac";

export type SalesLeadWithOwner = SalesLead & { assignedTo: TeamMember | null };

export const SALES_LEAD_PAGE_SIZE = 25;

export interface SalesLeadFilters {
  status?: SalesLeadStatus;
  priority?: LeadPriority;
  source?: SalesLeadSource;
  assignedToId?: string;
  city?: string;
  search?: string;
  page?: number;
}

export interface PaginatedSalesLeads {
  leads: SalesLeadWithOwner[];
  totalCount: number;
  totalPages: number;
  page: number;
}

/** Merges viewer scoping into filters - restricted viewers are pinned to their own leads regardless of what's in the query string. */
function scopedAssignedToId(filters: SalesLeadFilters, viewer: SalesCrmViewer): string | undefined {
  if (!viewer.hasFullAccess) return viewer.teamMemberId;
  return filters.assignedToId;
}

/** Same pagination shape as src/lib/queries/leads.ts's getLeads - kept consistent deliberately. */
export async function getSalesLeads(filters: SalesLeadFilters, viewer: SalesCrmViewer): Promise<PaginatedSalesLeads> {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const assignedToId = scopedAssignedToId(filters, viewer);

  const where = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.source ? { source: filters.source } : {}),
    ...(assignedToId ? { assignedToId } : {}),
    ...(filters.city ? { city: { equals: filters.city, mode: "insensitive" as const } } : {}),
    ...(filters.search
      ? {
          OR: [
            { businessName: { contains: filters.search, mode: "insensitive" as const } },
            { ownerName: { contains: filters.search, mode: "insensitive" as const } },
            { phone: { contains: filters.search, mode: "insensitive" as const } },
            { email: { contains: filters.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [leads, totalCount] = await Promise.all([
    prisma.salesLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * SALES_LEAD_PAGE_SIZE,
      take: SALES_LEAD_PAGE_SIZE,
      include: { assignedTo: true },
    }),
    prisma.salesLead.count({ where }),
  ]);

  return { leads, totalCount, totalPages: Math.max(1, Math.ceil(totalCount / SALES_LEAD_PAGE_SIZE)), page };
}

/** Returns null both when the lead doesn't exist AND when a restricted viewer isn't its owner - same "not found and not yours look identical" precedent used throughout this app's ownership-scoped queries. */
export async function getSalesLeadById(id: string, viewer: SalesCrmViewer) {
  const lead = await prisma.salesLead.findUnique({
    where: { id },
    include: {
      assignedTo: true,
      createdBy: true,
      project: { select: { id: true } },
    },
  });
  if (!lead) return null;
  if (!viewer.hasFullAccess && lead.assignedToId !== viewer.teamMemberId) return null;
  return lead;
}

export async function getSalesLeadTimeline(salesLeadId: string): Promise<(SalesLeadActivity & { performedBy: TeamMember | null })[]> {
  return prisma.salesLeadActivity.findMany({
    where: { salesLeadId },
    orderBy: { createdAt: "desc" },
    include: { performedBy: true },
  });
}

export async function getSalesLeadNotes(salesLeadId: string): Promise<(SalesLeadNote & { author: TeamMember | null })[]> {
  return prisma.salesLeadNote.findMany({
    where: { salesLeadId },
    orderBy: { createdAt: "desc" },
    include: { author: true },
  });
}

export async function getSalesLeadAttachments(salesLeadId: string) {
  return prisma.salesLeadAttachment.findMany({
    where: { salesLeadId },
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: true },
  });
}

export type FollowUpWithLead = Prisma.SalesFollowUpGetPayload<{ include: { salesLead: true; assignedTo: true } }>;

export interface FollowUpBuckets {
  overdue: FollowUpWithLead[];
  today: FollowUpWithLead[];
  upcoming: FollowUpWithLead[];
}

/** Buckets every still-PENDING follow-up into overdue/today/upcoming - scoped to one salesperson, or the whole team for a full-access viewer. */
export async function getFollowUpBuckets(viewer: SalesCrmViewer, assignedToId?: string): Promise<FollowUpBuckets> {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const scopedId = !viewer.hasFullAccess ? viewer.teamMemberId : assignedToId;

  const followUps = await prisma.salesFollowUp.findMany({
    where: {
      status: "PENDING",
      ...(scopedId ? { assignedToId: scopedId } : {}),
    },
    orderBy: { dueAt: "asc" },
    include: { salesLead: true, assignedTo: true },
  });

  return {
    overdue: followUps.filter((f) => f.dueAt < startOfToday),
    today: followUps.filter((f) => f.dueAt >= startOfToday && f.dueAt < startOfTomorrow),
    upcoming: followUps.filter((f) => f.dueAt >= startOfTomorrow),
  };
}

/** Every TeamMember eligible to own a SalesLead - the assignment picker's source list. */
export async function getSalesTeamMembers(): Promise<TeamMember[]> {
  return prisma.teamMember.findMany({
    where: { role: { in: ["SALESPERSON", "SALES_MANAGER", "FOUNDER", "ADMIN"] } },
    orderBy: { name: "asc" },
  });
}

/** Fallback owner for a lead created without an explicit assignee - same precedent as src/lib/queries/team-members.ts's getDefaultOwner() for the Lead CRM. */
export async function getDefaultSalesOwner(): Promise<TeamMember | null> {
  return prisma.teamMember.findFirst({ where: { role: "FOUNDER" }, orderBy: { createdAt: "asc" } });
}

/** Every follow-up (any status) for one lead, most recently due first - the lead detail page's Follow-ups panel. */
export async function getFollowUpsForLead(salesLeadId: string) {
  return prisma.salesFollowUp.findMany({
    where: { salesLeadId },
    orderBy: { dueAt: "desc" },
    include: { assignedTo: true },
  });
}
