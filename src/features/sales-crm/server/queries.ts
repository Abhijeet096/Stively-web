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

/** Shared by getSalesLeads (paginated) and getAllSalesLeadsForExport (unpaginated) - one filter-building path, not two. */
function buildSalesLeadWhere(filters: SalesLeadFilters, viewer: SalesCrmViewer) {
  const assignedToId = scopedAssignedToId(filters, viewer);
  return {
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
}

/** Same pagination shape as src/lib/queries/leads.ts's getLeads - kept consistent deliberately. */
export async function getSalesLeads(filters: SalesLeadFilters, viewer: SalesCrmViewer): Promise<PaginatedSalesLeads> {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const where = buildSalesLeadWhere(filters, viewer);

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

/** All leads matching the current filters, no pagination limit - CSV export needs the full matching set, not just the visible page. Capped at 5000 as a sanity ceiling. */
export async function getAllSalesLeadsForExport(filters: SalesLeadFilters, viewer: SalesCrmViewer): Promise<SalesLeadWithOwner[]> {
  const where = buildSalesLeadWhere(filters, viewer);
  return prisma.salesLead.findMany({ where, orderBy: { createdAt: "desc" }, take: 5000, include: { assignedTo: true } });
}

/** Returns null both when the lead doesn't exist AND when a restricted viewer isn't its owner - same "not found and not yours look identical" precedent used throughout this app's ownership-scoped queries. */
export async function getSalesLeadById(id: string, viewer: SalesCrmViewer) {
  const lead = await prisma.salesLead.findUnique({
    where: { id },
    include: {
      assignedTo: true,
      createdBy: true,
      project: { select: { id: true } },
      outreach: { orderBy: { createdAt: "desc" }, take: 1 },
      clientUser: { select: { id: true, name: true, email: true } },
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

export interface SalesDashboardStats {
  assignedLeads: number;
  todaysFollowUps: number;
  interested: number;
  proposalSent: number;
  negotiation: number;
  won: number;
  lost: number;
  /** Paise - sum of PAID SalesProjectPayment amounts recorded this calendar month. */
  monthlyRevenue: number;
  /** Paise. */
  pendingCommission: number;
  paidCommission: number;
  /** Paise - every commission ever generated, any status. */
  totalCommission: number;
  /** Paise - PAID commission whose paidAt falls in the current calendar month. */
  monthlyEarnings: number;
}

/**
 * The /sales/dashboard's numbers - real queries throughout. SalesProject/
 * SalesProjectPayment/SalesCommission rows don't exist yet until the
 * Convert-to-Project and Commission phases are built, so the revenue/
 * commission cards read zero until then - an honest empty state, not a
 * placeholder.
 */
export async function getSalesDashboardStats(viewer: SalesCrmViewer): Promise<SalesDashboardStats> {
  const assignedToId = viewer.hasFullAccess ? undefined : viewer.teamMemberId;
  const salesPersonId = viewer.hasFullAccess ? undefined : viewer.teamMemberId;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const leadWhere = assignedToId ? { assignedToId } : {};

  const [
    assignedLeads,
    todaysFollowUps,
    interested,
    proposalSent,
    negotiation,
    won,
    lost,
    monthlyPayments,
    pendingCommissions,
    paidCommissions,
    allCommissions,
    monthlyPaidCommissions,
  ] = await Promise.all([
    prisma.salesLead.count({ where: leadWhere }),
    prisma.salesFollowUp.count({
      where: { status: "PENDING", dueAt: { gte: startOfToday, lt: startOfTomorrow }, ...(assignedToId ? { assignedToId } : {}) },
    }),
    prisma.salesLead.count({ where: { ...leadWhere, status: "INTERESTED" } }),
    prisma.salesLead.count({ where: { ...leadWhere, status: "PROPOSAL_SENT" } }),
    prisma.salesLead.count({ where: { ...leadWhere, status: "NEGOTIATION" } }),
    prisma.salesLead.count({ where: { ...leadWhere, status: "WON" } }),
    prisma.salesLead.count({ where: { ...leadWhere, status: "LOST" } }),
    prisma.salesProjectPayment.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: startOfMonth },
        ...(salesPersonId ? { salesProject: { salesPersonId } } : {}),
      },
      select: { amount: true },
    }),
    prisma.salesCommission.findMany({
      where: { status: "PENDING", ...(salesPersonId ? { salesPersonId } : {}) },
      select: { commissionAmount: true },
    }),
    prisma.salesCommission.findMany({
      where: { status: "PAID", ...(salesPersonId ? { salesPersonId } : {}) },
      select: { commissionAmount: true },
    }),
    prisma.salesCommission.findMany({
      where: salesPersonId ? { salesPersonId } : {},
      select: { commissionAmount: true },
    }),
    prisma.salesCommission.findMany({
      where: { status: "PAID", paidAt: { gte: startOfMonth }, ...(salesPersonId ? { salesPersonId } : {}) },
      select: { commissionAmount: true },
    }),
  ]);

  const sum = (rows: { amount?: number; commissionAmount?: number }[], key: "amount" | "commissionAmount") =>
    rows.reduce((total, row) => total + (row[key] ?? 0), 0);

  return {
    assignedLeads,
    todaysFollowUps,
    interested,
    proposalSent,
    negotiation,
    won,
    lost,
    monthlyRevenue: sum(monthlyPayments, "amount"),
    pendingCommission: sum(pendingCommissions, "commissionAmount"),
    paidCommission: sum(paidCommissions, "commissionAmount"),
    totalCommission: sum(allCommissions, "commissionAmount"),
    monthlyEarnings: sum(monthlyPaidCommissions, "commissionAmount"),
  };
}

/** Every SalesTask visible to this viewer, open ones first - the /sales/tasks page. */
export async function getSalesTasksForViewer(viewer: SalesCrmViewer) {
  return prisma.salesTask.findMany({
    where: viewer.hasFullAccess ? {} : { assignedToId: viewer.teamMemberId },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    include: { salesLead: { select: { id: true, businessName: true } }, assignedTo: true },
  });
}

export interface SalesCommissionFilters {
  status?: Prisma.SalesCommissionWhereInput["status"];
  salesPersonId?: string;
}

/** Every SalesCommission visible to this viewer, newest first - the /sales/commission page and the admin commission CMS. Naturally empty until the Convert-to-Project and payment-recording flows exist to generate any. */
export async function getSalesCommissionsForViewer(viewer: SalesCrmViewer, filters: SalesCommissionFilters = {}) {
  return prisma.salesCommission.findMany({
    where: {
      ...(viewer.hasFullAccess ? {} : { salesPersonId: viewer.teamMemberId }),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.salesPersonId ? { salesPersonId: filters.salesPersonId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { salesPerson: true, salesProject: { select: { id: true, clientName: true } } },
  });
}

/** Lazily flips PENDING -> DUE for payments whose dueDate has passed - same "flip on read" pattern as InterviewLink's EXPIRED status, called before any project read. */
async function promoteDuePayments(salesProjectId: string): Promise<void> {
  await prisma.salesProjectPayment.updateMany({
    where: { salesProjectId, status: "PENDING", dueDate: { lt: new Date() } },
    data: { status: "DUE" },
  });
}

export type SalesProjectWithRelations = NonNullable<Awaited<ReturnType<typeof getSalesProjectById>>>;

/** Returns null both when the project doesn't exist and when a restricted viewer isn't its salesperson - same "not found and not yours look identical" precedent as getSalesLeadById. */
export async function getSalesProjectById(id: string, viewer: SalesCrmViewer) {
  const gate = await prisma.salesProject.findUnique({ where: { id }, select: { salesPersonId: true } });
  if (!gate) return null;
  if (!viewer.hasFullAccess && gate.salesPersonId !== viewer.teamMemberId) return null;

  await promoteDuePayments(id);

  return prisma.salesProject.findUnique({
    where: { id },
    include: {
      salesLead: true,
      salesPerson: true,
      projectManager: true,
      assignedDeveloper: true,
      payments: { orderBy: { createdAt: "asc" } },
      commissions: true,
      updates: { orderBy: { createdAt: "desc" }, include: { postedBy: { select: { name: true } } } },
      milestones: { orderBy: { order: "asc" } },
    },
  });
}

export type SalesProjectListItem = Prisma.SalesProjectGetPayload<{
  include: { salesPerson: true; payments: { select: { amount: true; status: true } } };
}>;

/** Every project visible to this viewer, newest first - /admin/sales-crm/projects and (scoped) a salesperson's own list. */
export async function getSalesProjectsForViewer(viewer: SalesCrmViewer): Promise<SalesProjectListItem[]> {
  return prisma.salesProject.findMany({
    where: viewer.hasFullAccess ? {} : { salesPersonId: viewer.teamMemberId },
    orderBy: { createdAt: "desc" },
    include: { salesPerson: true, payments: { select: { amount: true, status: true } } },
  });
}

export interface OfferingForQuote {
  id: string;
  title: string;
  price: number | null;
  currency: string;
}

/** Real catalog offerings, for the "base this quote on" picker - only ones actually live and buyable, so a salesperson never quotes off a draft/archived listing. */
export async function getOfferingsForQuotePicker(): Promise<OfferingForQuote[]> {
  return prisma.offering.findMany({
    where: { status: "PUBLISHED", visible: true },
    orderBy: { title: "asc" },
    select: { id: true, title: true, price: true, currency: true },
  });
}

/** Every quote sent for one lead, newest first - the lead detail page's Quotes panel. */
export async function getQuotesForLead(salesLeadId: string) {
  return prisma.salesQuote.findMany({
    where: { salesLeadId },
    orderBy: { createdAt: "desc" },
    include: { offering: { select: { title: true } }, createdBy: true },
  });
}

/** Every meeting scheduled for one lead, soonest first - the lead detail page's Meetings panel. */
export async function getMeetingsForLead(salesLeadId: string) {
  return prisma.salesLeadMeeting.findMany({
    where: { salesLeadId },
    orderBy: { scheduledAt: "desc" },
    include: { scheduledBy: { select: { name: true } } },
  });
}

/**
 * The full client<->staff message thread for one lead, oldest first (chat
 * reads chronologically, unlike every other newest-first feed in this
 * feature). Staff-only (called from the admin and sales lead-detail pages, never the
 * client-portal side) - so viewing this thread is exactly the "I've seen
 * it" signal for the client's messages. Marks them read as a side effect of
 * the fetch, not a separate click - same pattern any real chat app uses
 * (opening the thread is what clears the unread state).
 */
export async function getMessagesForLead(salesLeadId: string) {
  const [messages] = await Promise.all([
    prisma.salesLeadMessage.findMany({
      where: { salesLeadId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.salesLeadMessage.updateMany({
      where: { salesLeadId, readAt: null, sender: { role: "CLIENT" } },
      data: { readAt: new Date() },
    }),
  ]);
  return messages;
}

export interface UnreadMessageThread {
  salesLeadId: string;
  businessName: string;
  preview: string;
  createdAt: Date;
  unreadCount: number;
}

/**
 * One row per lead with at least one unread client message, newest first -
 * the "unread inbox" the Sales CRM dashboard's Messages widget renders.
 * Fetches every unread message (scoped to what this viewer can see, same
 * assignedToId rule as every other sales-crm query) rather than a groupBy,
 * since the realistic volume here is small - unread messages, not the full
 * history - and this keeps the "latest per lead" reduction simple and
 * correct without a raw query.
 */
export async function getUnreadMessageThreads(viewer: SalesCrmViewer): Promise<UnreadMessageThread[]> {
  const salesLeadWhere = buildSalesLeadWhere({}, viewer);

  const unread = await prisma.salesLeadMessage.findMany({
    where: { readAt: null, sender: { role: "CLIENT" }, salesLead: salesLeadWhere },
    orderBy: { createdAt: "desc" },
    include: { salesLead: { select: { businessName: true } } },
  });

  const byLead = new Map<string, UnreadMessageThread>();
  for (const message of unread) {
    const existing = byLead.get(message.salesLeadId);
    if (existing) {
      existing.unreadCount += 1;
      continue;
    }
    byLead.set(message.salesLeadId, {
      salesLeadId: message.salesLeadId,
      businessName: message.salesLead.businessName,
      preview: message.content.length > 100 ? `${message.content.slice(0, 97)}...` : message.content,
      createdAt: message.createdAt,
      unreadCount: 1,
    });
  }

  return Array.from(byLead.values());
}
