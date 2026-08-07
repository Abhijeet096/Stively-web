/**
 * Seeds the real Offering catalog - discovered empty (zero rows) during a
 * pre-launch audit, 2026-08-08, the day before Google Ads go live. This was
 * silently breaking more than the client dashboard: /website-development's
 * real pricing section (a direct ad-landing destination) reads
 * getOfferingForDisplay("startup-website-package") and renders nothing
 * when it's null, and the entire client-portal self-service catalog
 * (/client/offerings, the dashboard's "Explore offerings"/"Our services"
 * sections, the request-proposal wizard) had nothing to show or request
 * against.
 *
 * Pricing/features here are NOT invented - copied verbatim from
 * src/lib/pricing.ts's PRICING_TIERS, which is itself commented "Exact
 * tiers/pricing/inclusions as given by the client - not altered." This
 * seed exists so the same three already-public, already-approved tiers are
 * also queryable as real Offering rows, not a second, divergent set of
 * numbers.
 *
 * Run once: npx tsx prisma/seed-offerings.ts
 */
import { prisma } from "../src/lib/prisma";

async function main() {
  const offerings = [
    {
      slug: "startup-website-package",
      title: "Starter Website Package",
      shortDescription: "A fast, professional site for a business getting online.",
      longDescription:
        "A fast, professional website built for a business that needs to get online well - up to 5 pages, fully responsive, SEO-ready from launch, with a working contact form and a month of post-launch support included.",
      category: "WEBSITE_DEVELOPMENT" as const,
      audience: "BUSINESS" as const,
      status: "PUBLISHED" as const,
      featured: true,
      visible: true,
      purchaseFlow: "BOTH" as const,
      price: 899_900,
      pricingType: "FIXED" as const,
      duration: "2-3 Weeks",
      benefits: [
        "Responsive website",
        "Up to 5 pages",
        "SEO ready",
        "Contact form",
        "Fast performance",
        "1 month support",
      ],
      whatYoullLearn: [],
      whoItsFor: ["Small businesses getting online for the first time", "Businesses replacing an outdated site"],
      requirements: [],
      publishedAt: new Date(),
    },
    {
      slug: "business-website-package",
      title: "Business Website Package",
      shortDescription: "A custom-designed site with the content and integrations a growing business needs.",
      longDescription:
        "A custom-designed website for a growing business - real content management, a blog, deeper SEO work, a dashboard, and API integrations, with 3 months of post-launch support included.",
      category: "WEBSITE_DEVELOPMENT" as const,
      audience: "BUSINESS" as const,
      status: "PUBLISHED" as const,
      featured: true,
      visible: true,
      purchaseFlow: "CONSULTATION" as const,
      price: 2_499_900,
      pricingType: "FIXED" as const,
      duration: "4-6 Weeks",
      benefits: [
        "Custom design",
        "CMS",
        "Blog",
        "SEO optimization",
        "Dashboard",
        "API integration",
        "Performance optimization",
        "3 months support",
      ],
      whatYoullLearn: [],
      whoItsFor: ["Growing businesses that have outgrown a template site"],
      requirements: [],
      publishedAt: new Date(),
    },
    {
      slug: "enterprise-solution",
      title: "Enterprise Solution",
      shortDescription: "Website + E-commerce + Admin Panel + Mobile App - a full custom platform.",
      longDescription:
        "A full custom platform for businesses that need more than a website - e-commerce, an admin panel, a mobile app, payment gateway integration, authentication, analytics, and advanced security, with 6 months of post-launch support included.",
      category: "SOFTWARE_DEVELOPMENT" as const,
      audience: "BUSINESS" as const,
      status: "PUBLISHED" as const,
      featured: false,
      visible: true,
      purchaseFlow: "CONSULTATION" as const,
      price: 4_999_900,
      pricingType: "FIXED" as const,
      duration: "8-12 Weeks",
      benefits: [
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
      whatYoullLearn: [],
      whoItsFor: ["Businesses that need a full platform, not just a website"],
      requirements: [],
      publishedAt: new Date(),
    },
  ];

  for (const offering of offerings) {
    const result = await prisma.offering.upsert({
      where: { slug: offering.slug },
      create: offering,
      update: offering,
    });
    console.log(`${result.status === "PUBLISHED" ? "✓" : "?"} ${result.slug} (${result.id})`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("seed-offerings failed:", error);
    process.exit(1);
  });
