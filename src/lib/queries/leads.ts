import { prisma } from "@/lib/prisma";
import type {
  Lead,
  LeadHistory,
  LeadNote,
  LeadMeeting,
  LeadType,
  LeadStatus,
  LeadPriority,
  LeadSource,
  TeamMember,
} from "@prisma/client";

export type LeadWithOwner = Lead & { currentOwner: TeamMember | null };

/**
 * Single lead lookup, with its current owner attached - the natural
 * foundation for a future lead detail page, not built here.
 */
export async function getLeadById(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: { currentOwner: true, program: { select: { title: true } } },
  });
}

/**
 * The full chronological event timeline for one lead, oldest first - per
 * v1.2 §3, LeadHistory is a general event log, not just status changes.
 * Ordered ascending (not the query-default descending) because a timeline
 * reads top-to-bottom as "what happened, in order," not "what happened
 * most recently first."
 */
export async function getLeadTimeline(leadId: string): Promise<LeadHistory[]> {
  return prisma.leadHistory.findMany({
    where: { leadId },
    orderBy: { createdAt: "asc" },
  });
}

export const LEAD_PAGE_SIZE = 25;

export interface LeadFilters {
  leadType?: LeadType;
  status?: LeadStatus;
  priority?: LeadPriority;
  ownerId?: string;
  source?: LeadSource;
  search?: string;
  page?: number;
}

export interface PaginatedLeads {
  leads: LeadWithOwner[];
  totalCount: number;
  totalPages: number;
  page: number;
}

/**
 * The foundation a future CRM lead-list view will filter/paginate
 * against - same shape as src/lib/queries/programs.ts's
 * getPaginatedPrograms, kept consistent deliberately rather than
 * inventing a different pagination pattern for leads.
 */
export async function getLeads(filters: LeadFilters): Promise<PaginatedLeads> {
  const page = filters.page && filters.page > 0 ? filters.page : 1;

  const where = {
    ...(filters.leadType ? { leadType: filters.leadType } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.ownerId ? { currentOwnerId: filters.ownerId } : {}),
    ...(filters.source ? { source: filters.source } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" as const } },
            { email: { contains: filters.search, mode: "insensitive" as const } },
            { phone: { contains: filters.search, mode: "insensitive" as const } },
            { companyName: { contains: filters.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [leads, totalCount] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * LEAD_PAGE_SIZE,
      take: LEAD_PAGE_SIZE,
      include: { currentOwner: true },
    }),
    prisma.lead.count({ where }),
  ]);

  return {
    leads,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / LEAD_PAGE_SIZE)),
    page,
  };
}

export interface LeadCounts {
  studentLeads: number;
  businessLeads: number;
  newToday: number;
  interested: number;
  converted: number;
  lost: number;
}

/**
 * The first tier of Lead Intake v1.2 §11's CEO Dashboard KPIs (Student
 * Leads / Business Leads / New Leads Today / Conversion Rate / Lost
 * Rate), as data functions only - no dashboard consumes this yet.
 */
export async function getLeadCounts(): Promise<LeadCounts> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [studentLeads, businessLeads, newToday, interested, converted, lost] = await Promise.all([
    prisma.lead.count({ where: { leadType: "STUDENT" } }),
    prisma.lead.count({ where: { leadType: "BUSINESS" } }),
    prisma.lead.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.lead.count({ where: { status: "INTERESTED" } }),
    prisma.lead.count({ where: { status: "CONVERTED" } }),
    prisma.lead.count({ where: { status: { in: ["LOST", "NOT_INTERESTED"] } } }),
  ]);

  return { studentLeads, businessLeads, newToday, interested, converted, lost };
}

export interface LeadStatistics extends LeadCounts {
  totalLeads: number;
  conversionRate: number;
  lostRate: number;
  /** Sum of estimatedValue across non-terminal leads - an estimate, not actual revenue. See v1.2 §10/§11. */
  estimatedPipelineValue: number;
}

/**
 * Broader aggregate statistics, still data-only. Deliberately stops here -
 * richer analytics named in v1.2 §11 (Average Sales Cycle, Top
 * Salesperson, Top Acquisition Channel) need either LeadHistory timestamp
 * math or careful attribution logic (see v1.2 §11's Top Salesperson
 * caveat) and are left for when the Analytics module actually gets built,
 * per this task's "no unnecessary abstraction" instruction - building
 * every possible future metric now would be exactly that.
 */
export async function getLeadStatistics(): Promise<LeadStatistics> {
  const counts = await getLeadCounts();
  const totalLeads = counts.studentLeads + counts.businessLeads;

  const pipelineValueResult = await prisma.lead.aggregate({
    where: { status: { notIn: ["CONVERTED", "LOST", "NOT_INTERESTED"] } },
    _sum: { estimatedValue: true },
  });

  return {
    ...counts,
    totalLeads,
    conversionRate: totalLeads > 0 ? counts.converted / totalLeads : 0,
    lostRate: totalLeads > 0 ? counts.lost / totalLeads : 0,
    estimatedPipelineValue: pipelineValueResult._sum.estimatedValue ?? 0,
  };
}

/**
 * The Dashboard Home's Recent Leads table - most recent N leads, owner
 * attached. Deliberately its own function rather than calling getLeads()
 * with a small page size - that function's pagination/filter machinery
 * would be unused overhead for a fixed "latest N" list, and the two
 * having slightly different shapes over time (this one never needs
 * filters) is a real, not just theoretical, difference in what they're for.
 */
export async function getRecentLeads(limit = 5): Promise<LeadWithOwner[]> {
  return prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { currentOwner: true },
  });
}

export interface RecentActivityItem extends LeadHistory {
  lead: { id: string; name: string; leadType: LeadType };
}

/**
 * Dashboard Home's "Latest Activity" feed - the most recent LeadHistory
 * events across every lead, not one lead's timeline (that's
 * getLeadTimeline, for the lead detail page). Includes just enough of the
 * parent Lead (id, name, type) to render "Ananya Verma - Status changed"
 * without a second query per row.
 */
export async function getRecentActivity(limit = 10): Promise<RecentActivityItem[]> {
  return prisma.leadHistory.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { lead: { select: { id: true, name: true, leadType: true } } },
  });
}

export interface FollowUpBuckets {
  overdue: LeadWithOwner[];
  today: LeadWithOwner[];
  upcoming: LeadWithOwner[];
}

/**
 * Buckets leads by nextFollowUpAt relative to now, for the Follow-ups
 * widget's green/orange/red treatment (upcoming/today/overdue). Excludes
 * leads already in a terminal state (CONVERTED/LOST/NOT_INTERESTED) - a
 * follow-up date on a closed lead isn't something anyone needs reminding
 * about. "Upcoming" is capped to the next 7 days rather than unbounded,
 * so this stays a short, actionable list instead of every future
 * follow-up ever scheduled.
 */
export async function getFollowUps(): Promise<FollowUpBuckets> {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const sevenDaysOut = new Date(now);
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);

  const activeOnly = {
    status: { notIn: ["CONVERTED", "LOST", "NOT_INTERESTED"] as LeadStatus[] },
  };

  const [overdue, today, upcoming] = await Promise.all([
    prisma.lead.findMany({
      where: { ...activeOnly, nextFollowUpAt: { lt: startOfToday } },
      orderBy: { nextFollowUpAt: "asc" },
      include: { currentOwner: true },
    }),
    prisma.lead.findMany({
      where: { ...activeOnly, nextFollowUpAt: { gte: startOfToday, lte: endOfToday } },
      orderBy: { nextFollowUpAt: "asc" },
      include: { currentOwner: true },
    }),
    prisma.lead.findMany({
      where: { ...activeOnly, nextFollowUpAt: { gt: endOfToday, lte: sevenDaysOut } },
      orderBy: { nextFollowUpAt: "asc" },
      include: { currentOwner: true },
    }),
  ]);

  return { overdue, today, upcoming };
}

/** Notes for one lead, newest first - the display order this task asks for, and the natural one for a note feed. */
export async function getLeadNotes(leadId: string): Promise<LeadNote[]> {
  return prisma.leadNote.findMany({
    where: { leadId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLeadMeetings(
  leadId: string
): Promise<(LeadMeeting & { scheduledBy: Pick<TeamMember, "name"> | null })[]> {
  return prisma.leadMeeting.findMany({
    where: { leadId },
    include: { scheduledBy: { select: { name: true } } },
    orderBy: { scheduledAt: "desc" },
  });
}

export const LEAD_TYPES = ["STUDENT", "BUSINESS"] as const;
export const LEAD_SOURCES = [
  "CONTACT_FORM",
  "PROGRAM_INTEREST",
  "CAREERS",
  "NEWSLETTER_POPUP",
  "CLIENT_PORTAL",
  "START_PROJECT",
  "OTHER",
] as const;
export const LEAD_STATUSES = [
  "NEW",
  "ASSIGNED",
  "FIRST_CALL",
  "INTERESTED",
  "CALLBACK_REQUESTED",
  "NOT_RESPONDED",
  "NOT_INTERESTED",
  "COUNSELLING",
  "ENROLLMENT",
  "PAYMENT",
  "INITIAL_CONTACT",
  "WHATSAPP_DISCUSSION",
  "DISCOVERY_CALL",
  "REQUIREMENTS_GATHERING",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "PROJECT_APPROVED",
  "DEVELOPMENT_STARTED",
  "CONVERTED",
  "LOST",
] as const;

/** Type guards for raw searchParams strings, same pattern already established for Training's filters. */
export function isValidLeadType(value: string | undefined): value is LeadType {
  return !!value && (LEAD_TYPES as readonly string[]).includes(value);
}
export function isValidLeadSource(value: string | undefined): value is LeadSource {
  return !!value && (LEAD_SOURCES as readonly string[]).includes(value);
}
export function isValidLeadStatus(value: string | undefined): value is LeadStatus {
  return !!value && (LEAD_STATUSES as readonly string[]).includes(value);
}

export interface InboundLeadsForViewer {
  unclaimed: LeadWithOwner[];
  mine: LeadWithOwner[];
}

/**
 * The /sales/inbound page's data source - unclaimed leads (currentOwnerId
 * null) any Role.SALES rep may claim, plus this rep's own already-claimed
 * leads. Deliberately excludes leads claimed by other reps - once claimed,
 * only the admin (getLeads/getLeadById, unfiltered) and the claiming rep
 * (via `mine` here) can see a Lead, per the claim system's exclusivity rule.
 */
export async function getInboundLeadsForViewer(teamMemberId: string | null): Promise<InboundLeadsForViewer> {
  const [unclaimed, mine] = await Promise.all([
    prisma.lead.findMany({
      where: { currentOwnerId: null },
      orderBy: { createdAt: "desc" },
      include: { currentOwner: true },
    }),
    teamMemberId
      ? prisma.lead.findMany({
          where: { currentOwnerId: teamMemberId },
          orderBy: { createdAt: "desc" },
          include: { currentOwner: true },
        })
      : Promise.resolve([]),
  ]);
  return { unclaimed, mine };
}
