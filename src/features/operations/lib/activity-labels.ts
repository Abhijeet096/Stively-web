import {
  Sparkles,
  UserPlus,
  Repeat,
  ArrowRightLeft,
  Flag,
  CalendarClock,
  CalendarCheck,
  Wallet,
  MessageSquare,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import type { ActivityType } from "@prisma/client";

export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  CREATED: "Created",
  ASSIGNED: "Assigned",
  REASSIGNED: "Reassigned",
  STATUS_CHANGED: "Status changed",
  PRIORITY_CHANGED: "Priority changed",
  DUE_DATE_CHANGED: "Due date changed",
  MEETING_SCHEDULED: "Meeting scheduled",
  PAYMENT_RECEIVED: "Payment received",
  NOTE_ADDED: "Note added",
  COMPLETED: "Completed",
};

export const ACTIVITY_ICON: Record<ActivityType, LucideIcon> = {
  CREATED: Sparkles,
  ASSIGNED: UserPlus,
  REASSIGNED: Repeat,
  STATUS_CHANGED: ArrowRightLeft,
  PRIORITY_CHANGED: Flag,
  DUE_DATE_CHANGED: CalendarClock,
  MEETING_SCHEDULED: CalendarCheck,
  PAYMENT_RECEIVED: Wallet,
  NOTE_ADDED: MessageSquare,
  COMPLETED: CheckCircle2,
};
