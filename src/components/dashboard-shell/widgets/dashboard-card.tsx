import { Card, type CardProps } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DashboardCardProps extends CardProps {
  padding?: "default" | "compact";
}

/**
 * The default content container for dashboard sections - a thin,
 * intention-revealing wrapper over the shared `Card` primitive
 * (src/components/ui/card.tsx) rather than a parallel styling system.
 * Exists so dashboard-specific padding conventions live in one place
 * instead of being repeated as raw className strings on every `<Card>`
 * across every role's pages.
 */
function DashboardCard({ padding = "default", className, ...props }: DashboardCardProps) {
  return (
    <Card
      className={cn(
        // Unlike bare `Card` (which leaves horizontal padding to its
        // CardHeader/CardContent/CardFooter slots), DashboardCard is meant
        // to take children directly - so padding lives here, on the root.
        padding === "compact" ? "gap-4 px-4 py-4" : "gap-5 px-5 py-5",
        className
      )}
      {...props}
    />
  );
}

export { DashboardCard };
