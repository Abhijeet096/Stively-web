export interface PricingTier {
  name: string;
  /** Smallest INR unit, same convention as Program.price (see prisma/schema.prisma) - passed straight to formatPrice, never reformatted independently. */
  priceInPaise: number;
  description: string;
  features: string[];
  highlighted?: boolean;
}

// Exact tiers/pricing/inclusions as given by the client - not altered.
// Kept in a plain (non "use client") module so server components (the
// /pricing route's JSON-LD) can import the data directly - a "use client"
// module's plain exports become client references when imported
// server-side, which breaks any server-side .map()/computation over them.
export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Starter Website",
    priceInPaise: 899_900,
    description: "A fast, professional site for a business getting online.",
    features: [
      "Responsive website",
      "Up to 5 pages",
      "SEO ready",
      "Contact form",
      "Fast performance",
      "1 month support",
    ],
  },
  {
    name: "Business Website",
    priceInPaise: 2_499_900,
    description: "A custom-designed site with the content and integrations a growing business needs.",
    features: [
      "Custom design",
      "CMS",
      "Blog",
      "SEO optimization",
      "Dashboard",
      "API integration",
      "Performance optimization",
      "3 months support",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise Solution",
    priceInPaise: 4_999_900,
    description: "Website + E-commerce + Admin Panel + Mobile App - a full custom platform.",
    features: [
      "Custom website",
      "E-commerce",
      "Admin panel",
      "Android/iOS app",
      "Payment gateway",
      "Authentication",
      "Analytics",
      "AI features (if required)",
      "Advanced security",
      "6 months support",
    ],
  },
];
