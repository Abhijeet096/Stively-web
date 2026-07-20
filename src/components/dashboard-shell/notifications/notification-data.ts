export interface Notification {
  id: string;
  title: string;
  description: string;
  /** Pre-formatted relative label ("2h ago") - no live timestamp math needed for static placeholder data. */
  timeLabel: string;
  read: boolean;
  href?: string;
}

/**
 * Static placeholder data - there's no notifications backend yet (this
 * phase builds the frontend infrastructure only, per the brief). A real
 * implementation swaps this constant for a query/subscription; nothing
 * about NotificationBell or NotificationDropdown's props needs to change,
 * since both already just take a `notifications` list + change handlers.
 */
export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    title: "New training cohort opens soon",
    description: "The next Full-Stack Web Development cohort starts enrolling next week.",
    timeLabel: "2h ago",
    read: false,
    href: "/training",
  },
  {
    id: "n2",
    title: "Your callback request was received",
    description: "A team member will reach out within one business day.",
    timeLabel: "1d ago",
    read: false,
  },
  {
    id: "n3",
    title: "New blog post published",
    description: "“How to prepare for your first internship interview” is now live.",
    timeLabel: "3d ago",
    read: true,
    href: "/student/blogs",
  },
];
