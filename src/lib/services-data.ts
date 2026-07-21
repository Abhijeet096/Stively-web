import { Code2, Globe, Bot, Smartphone, Plug, Users2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ServiceOffering {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Split out of services-grid.tsx so a Client Component (CapabilitiesStrip)
 * can import this plain data array without dragging that module's
 * server-only JsonLd usage into the client bundle.
 */
export const SERVICES: ServiceOffering[] = [
  {
    icon: Globe,
    title: "Web Application Development",
    description:
      "Full-stack web applications built on modern, maintainable frameworks - not template sites.",
  },
  {
    icon: Code2,
    title: "Custom Software Development",
    description:
      "Software built around how your business actually works, not the other way around.",
  },
  {
    icon: Bot,
    title: "AI & Automation",
    description:
      "Practical automation and AI integration that removes repetitive work, not novelty features.",
  },
  {
    icon: Smartphone,
    title: "Mobile App Development",
    description:
      "Cross-platform mobile applications built on the same engineering standards as our web work.",
  },
  {
    icon: Plug,
    title: "API & Systems Integration",
    description: "Connecting the tools you already use, cleanly, without brittle one-off scripts.",
  },
  {
    icon: Users2,
    title: "Technical Consulting",
    description:
      "Architecture and technology decisions reviewed before they become expensive to change.",
  },
];
