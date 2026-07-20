import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface QuickActionCardProps {
  label: string;
  description: string;
  icon: LucideIcon;
  href: string;
  className?: string;
}

/**
 * The tile behind every "Quick Actions" grid (Student's Browse Training /
 * Browse Internships / Career Guidance / Request Callback, and reused
 * anywhere else a role's dashboard wants a shortcut grid). Elegant hover
 * only - a 1px border color shift and a small arrow nudge, no scale/shadow
 * theatrics, per this phase's "subtle hover states" constraint.
 */
function QuickActionCard({ label, description, icon: Icon, href, className }: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group border-border bg-card hover:border-foreground/20 hover:bg-accent/40 flex flex-col gap-3 rounded-xl border p-4 transition-colors duration-200 ease-out",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
        <ArrowUpRight
          className="text-muted-foreground size-4 shrink-0 opacity-0 transition-all duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
          aria-hidden="true"
        />
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="text-foreground text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs text-pretty">{description}</p>
      </div>
    </Link>
  );
}

export { QuickActionCard };
