/**
 * Seeds the Digital Store catalog - one real, purchasable product (100
 * Practical AI Prompts, DIGITAL_PRODUCT, guest checkout, ₹99) plus five
 * Coming Soon placeholders so the storefront shows the full planned lineup
 * without pretending they're buyable yet.
 *
 * Cover images already live in public/digital-store/ (renamed from the
 * founder's original uploads to URL-safe filenames). The real ebook PDF
 * lives outside public/ at private/digital-products/ - see
 * src/features/orders/server/digital-download.ts for why it's never served
 * as a static asset.
 *
 * Run once: npx tsx prisma/seed-digital-store.ts
 */
import { prisma } from "../src/lib/prisma";

async function main() {
  const offerings = [
    {
      slug: "100-practical-ai-prompts",
      title: "100 Practical AI Prompts",
      shortDescription: "100 reusable prompts for study, career, work, content and everyday AI use.",
      longDescription:
        "100 ready-to-use AI prompts organized into 5 practical categories - Study & Learning, Career & Job Search, Work & Productivity, Content & Creativity, and Business & Everyday Life. A clean, printable PDF you can start using immediately, no prompt-engineering experience needed.",
      category: "DIGITAL_PRODUCT" as const,
      audience: "BOTH" as const,
      status: "PUBLISHED" as const,
      featured: true,
      visible: true,
      purchaseFlow: "DIRECT_PAYMENT" as const,
      allowsGuestCheckout: true,
      price: 9_900,
      pricingType: "FIXED" as const,
      thumbnailUrl: "/digital-store/100-prompts.png",
      digitalAssetPath: "digital-products/100-practical-ai-prompts.pdf",
      tags: ["AI & Prompting"],
      benefits: [],
      whatYoullLearn: [],
      whoItsFor: ["Students", "Job seekers", "Professionals using AI tools day to day"],
      requirements: [],
      publishedAt: new Date(),
    },
    {
      slug: "500-ai-prompt-templates",
      title: "500 AI Prompt Templates",
      shortDescription: "A massive library of 500 ready-to-use prompts across multiple categories.",
      longDescription:
        "500 ready-to-use AI prompt templates spanning chat, content creation, productivity, learning, development and strategy - coming soon to the Stively Digital Store.",
      category: "DIGITAL_PRODUCT" as const,
      audience: "BOTH" as const,
      status: "COMING_SOON" as const,
      featured: false,
      visible: true,
      purchaseFlow: "DIRECT_PAYMENT" as const,
      price: 19_900,
      pricingType: "FIXED" as const,
      thumbnailUrl: "/digital-store/500-prompts.png",
      benefits: [],
      whatYoullLearn: [],
      whoItsFor: [],
      requirements: [],
    },
    {
      slug: "resume-job-search-toolkit",
      title: "Resume & Job Search Toolkit",
      shortDescription: "Templates, prompts and strategies to help you land your next opportunity.",
      longDescription:
        "Resume templates, interview-prep prompts, job-search strategies and career-growth tips - coming soon to the Stively Digital Store.",
      category: "DIGITAL_PRODUCT" as const,
      audience: "BOTH" as const,
      status: "COMING_SOON" as const,
      featured: false,
      visible: true,
      purchaseFlow: "DIRECT_PAYMENT" as const,
      price: 14_900,
      pricingType: "FIXED" as const,
      thumbnailUrl: "/digital-store/resume-job-search-kit.png",
      benefits: [],
      whatYoullLearn: [],
      whoItsFor: [],
      requirements: [],
    },
    {
      slug: "ai-content-creation-kit",
      title: "AI Content Creation Kit",
      shortDescription: "Prompts, templates and frameworks for blogs, social media, videos and more.",
      longDescription:
        "Prompts, templates and frameworks for creating blog posts, social media content and video scripts with AI - coming soon to the Stively Digital Store.",
      category: "DIGITAL_PRODUCT" as const,
      audience: "BOTH" as const,
      status: "COMING_SOON" as const,
      featured: false,
      visible: true,
      purchaseFlow: "DIRECT_PAYMENT" as const,
      price: 19_900,
      pricingType: "FIXED" as const,
      thumbnailUrl: "/digital-store/content-creation-kit.png",
      benefits: [],
      whatYoullLearn: [],
      whoItsFor: [],
      requirements: [],
    },
    {
      slug: "business-prompt-pack",
      title: "Business Prompt Pack",
      shortDescription: "Powerful prompts for strategy, marketing, operations and everyday business tasks.",
      longDescription:
        "AI prompts covering strategy & planning, marketing & content, operations & management, and sales & growth - coming soon to the Stively Digital Store.",
      category: "DIGITAL_PRODUCT" as const,
      audience: "BUSINESS" as const,
      status: "COMING_SOON" as const,
      featured: false,
      visible: true,
      purchaseFlow: "DIRECT_PAYMENT" as const,
      price: 24_900,
      pricingType: "FIXED" as const,
      thumbnailUrl: "/digital-store/business-prompt-pack.png",
      benefits: [],
      whatYoullLearn: [],
      whoItsFor: [],
      requirements: [],
    },
  ];

  for (const offering of offerings) {
    const result = await prisma.offering.upsert({
      where: { slug: offering.slug },
      create: offering,
      update: offering,
    });
    console.log(`${result.status === "PUBLISHED" ? "✓" : "…"} ${result.slug} (${result.id})`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("seed-digital-store failed:", error);
    process.exit(1);
  });
