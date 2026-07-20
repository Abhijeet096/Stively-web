import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Small trailing indicator (e.g. an unread count). Static for now - no live data source exists yet. */
  badge?: string | number;
  /**
   * True when `href` points at an existing public/marketing route or
   * another role's app section (e.g. Student's "Training Programs" links
   * to the real public `/training` catalog rather than a duplicate
   * portal-only copy). Purely a documentation flag today - kept on the
   * type because it's the kind of thing a future breadcrumb or
   * "you're leaving your dashboard" affordance would want to key off.
   */
  external?: boolean;
}

export interface NavSection {
  /** Omitted for the first, unlabeled "primary" section every config starts with. */
  title?: string;
  items: NavItem[];
}

/**
 * One role's entire sidebar, top to bottom. This is the only shape a new
 * role's navigation file needs to export - see src/config/navigation/index.ts
 * for how a role maps to its config, and any *.ts file beside this one for
 * a concrete example.
 */
export type NavigationConfig = NavSection[];
