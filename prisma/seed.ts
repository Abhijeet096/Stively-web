import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Idempotent by slug (upsert, not create) - safe to re-run against the same
 * database without duplicating rows. Dev-only convenience for actually
 * seeing the Offerings UI populated instead of only ever exercising its
 * empty states; never runs automatically outside `prisma db seed` /
 * `npm run db:seed`.
 *
 * Deliberately spans every OfferingCategory, every audience, every
 * PricingType, and a DRAFT + a COMING_SOON row (to verify status filtering
 * actually excludes them from the public catalog).
 */
const OFFERINGS: Prisma.OfferingCreateInput[] = [
  {
    slug: "full-stack-web-development",
    title: "Full Stack Web Development",
    shortDescription: "A cohort-based program covering the full modern web stack, start to deploy.",
    longDescription:
      "Go from zero to shipping production apps: HTML/CSS/JavaScript fundamentals, React and Next.js on the frontend, Node.js and REST APIs on the backend, and PostgreSQL with Prisma for data - all built around a real capstone project, not toy exercises.",
    category: "TRAINING",
    audience: "STUDENT",
    status: "PUBLISHED",
    featured: true,
    purchaseFlow: "BOTH",
    price: 2_500_000,
    pricingType: "FIXED",
    duration: "6 Months",
    mode: "ONLINE",
    difficulty: "BEGINNER",
    capacity: 30,
    whatYoullLearn: [
      "HTML, CSS & JavaScript fundamentals",
      "React & Next.js",
      "Node.js & REST APIs",
      "PostgreSQL & Prisma",
      "Git & deployment workflows",
    ],
    benefits: [
      "Live mentor-led sessions",
      "Real-world capstone project",
      "Placement support after completion",
    ],
    whoItsFor: ["Beginners with no prior coding experience", "Career switchers moving into tech"],
    requirements: [
      "A laptop",
      "4-6 hours/week for coursework",
      "No prior programming experience required",
    ],
    faqs: [
      {
        question: "Do I need any prior coding experience?",
        answer: "No - this program starts from the fundamentals.",
      },
      {
        question: "Is there a certificate on completion?",
        answer: "Yes, a completion certificate is issued once you finish the capstone project.",
      },
    ],
    instructorName: "Rahul Mehta",
    tags: ["web-development", "react", "nodejs"],
    publishedAt: new Date(),
  },
  {
    slug: "ai-chatbot-development",
    title: "AI Chatbot Development",
    shortDescription: "A custom AI chatbot trained on your business, deployed where your customers are.",
    longDescription:
      "We design, train, and deploy an AI assistant tailored to your business - trained on your own documentation and support history, deployable on your website and WhatsApp, with support after launch.",
    category: "AI_SOLUTIONS",
    audience: "BUSINESS",
    status: "PUBLISHED",
    pricingType: "CUSTOM_QUOTE",
    duration: "4 Weeks",
    mode: "ONLINE",
    benefits: [
      "Custom-trained on your business data",
      "Multi-channel deployment (web, WhatsApp)",
      "Ongoing support after launch",
    ],
    whoItsFor: [
      "Businesses looking to automate customer support",
      "Teams wanting a branded AI assistant",
    ],
    requirements: [
      "Access to your existing support documentation",
      "A stakeholder available for weekly check-ins",
    ],
    faqs: [
      {
        question: "How is pricing determined?",
        answer:
          "Every AI project is scoped individually after a discovery call - pricing depends on complexity and integrations.",
      },
    ],
    tags: ["ai", "chatbot", "automation"],
    publishedAt: new Date(),
  },
  {
    slug: "custom-software-development",
    title: "Custom Software Development",
    shortDescription: "A dedicated team to design, build, and ship your product.",
    longDescription:
      "From a rough idea or a documented spec to a deployed product - a dedicated project team, milestone-based delivery, and full source code ownership once the engagement wraps.",
    category: "SOFTWARE_DEVELOPMENT",
    audience: "BUSINESS",
    status: "PUBLISHED",
    featured: true,
    pricingType: "CUSTOM_QUOTE",
    duration: "8-16 Weeks",
    mode: "HYBRID",
    benefits: [
      "Dedicated project team",
      "Milestone-based delivery",
      "Source code ownership on completion",
    ],
    whoItsFor: ["Startups building an MVP", "Businesses replacing a legacy system"],
    requirements: [
      "A documented (or roughly scoped) set of requirements",
      "A point of contact for weekly syncs",
    ],
    tags: ["software", "mvp", "product-development"],
    publishedAt: new Date(),
  },
  {
    slug: "performance-marketing-bootcamp",
    title: "Performance Marketing Bootcamp",
    shortDescription: "Hands-on training in SEO, paid ads, and analytics.",
    longDescription:
      "A practical, project-based bootcamp covering SEO fundamentals, Google and Meta Ads, analytics and reporting, and content strategy - built around real ad-spend simulations, not slides.",
    category: "DIGITAL_MARKETING",
    audience: "STUDENT",
    status: "PUBLISHED",
    purchaseFlow: "BOTH",
    price: 1_500_000,
    pricingType: "FIXED",
    duration: "3 Months",
    mode: "ONLINE",
    difficulty: "BEGINNER",
    whatYoullLearn: ["SEO fundamentals", "Google & Meta Ads", "Analytics & reporting", "Content strategy"],
    benefits: ["Hands-on ad-spend simulations", "Portfolio-ready case studies"],
    whoItsFor: ["Marketing graduates", "Founders who want to run their own campaigns"],
    tags: ["marketing", "seo", "ads"],
    publishedAt: new Date(),
  },
  {
    slug: "software-engineering-internship",
    title: "Software Engineering Internship",
    shortDescription: "Real client project exposure with mentor-guided code reviews.",
    longDescription:
      "A placement working on real client projects alongside our engineering team - mentor-guided code reviews, real deadlines, and a letter of recommendation for those who complete it.",
    category: "INTERNSHIP",
    audience: "STUDENT",
    status: "PUBLISHED",
    pricingType: "FREE",
    duration: "3 Months",
    mode: "HYBRID",
    difficulty: "INTERMEDIATE",
    benefits: [
      "Real client project exposure",
      "Mentor-guided code reviews",
      "Letter of recommendation on completion",
    ],
    whoItsFor: ["Students who've completed a training program or equivalent self-study"],
    requirements: ["Working knowledge of at least one programming language", "Availability for 20 hours/week"],
    tags: ["internship", "placement"],
    publishedAt: new Date(),
  },
  {
    slug: "career-guidance-session",
    title: "Career Guidance Session",
    shortDescription: "A one-on-one session to map out your path into tech.",
    longDescription:
      "A focused, one-on-one conversation with a career advisor to figure out which path - and which program, if any - actually fits where you are and where you want to go.",
    category: "CAREER_GUIDANCE",
    audience: "STUDENT",
    status: "PUBLISHED",
    purchaseFlow: "DIRECT_PAYMENT",
    pricingType: "FREE",
    duration: "45 minutes",
    mode: "ONLINE",
    capacity: 1,
    benefits: ["One-on-one with a career advisor", "A personalized learning roadmap"],
    whoItsFor: ["Students unsure which program fits their goals"],
    tags: ["career", "guidance"],
    publishedAt: new Date(),
  },
  {
    slug: "corporate-team-upskilling",
    title: "Corporate Team Upskilling",
    shortDescription: "Training your team on the stack and tools they actually use.",
    longDescription:
      "Curriculum built around your team's real stack and workflows - delivered on-site or remote, with progress reporting so managers can see what's landing.",
    category: "CORPORATE_TRAINING",
    audience: "BUSINESS",
    status: "PUBLISHED",
    pricingType: "CUSTOM_QUOTE",
    duration: "Flexible",
    mode: "HYBRID",
    benefits: [
      "Curriculum tailored to your team's stack",
      "On-site or remote delivery",
      "Progress reporting for managers",
    ],
    whoItsFor: ["Engineering teams adopting a new stack", "Non-technical teams building AI literacy"],
    tags: ["corporate", "upskilling"],
    publishedAt: new Date(),
  },
  {
    slug: "startup-website-package",
    title: "Startup Website Package",
    shortDescription: "A fast, professional website to get your business online.",
    longDescription:
      "A responsive, SEO-ready website up to 5 pages, built and shipped in weeks - with a month of support after launch to fix anything that comes up.",
    category: "WEBSITE_DEVELOPMENT",
    audience: "BUSINESS",
    status: "PUBLISHED",
    featured: true,
    purchaseFlow: "DIRECT_PAYMENT",
    price: 899_900,
    pricingType: "FIXED",
    duration: "2-3 Weeks",
    mode: "ONLINE",
    benefits: ["Responsive, SEO-ready site", "Up to 5 pages", "1 month of post-launch support"],
    whoItsFor: ["Businesses that need to get online fast"],
    tags: ["website", "startup"],
    publishedAt: new Date(),
  },
  {
    slug: "stively-cloud",
    title: "Stively Cloud",
    shortDescription: "A unified workspace for training, projects, and client delivery - coming soon.",
    longDescription:
      "One workspace spanning cohort management, project delivery, and client reporting - built from everything we've learned running Stively itself. Coming soon.",
    category: "SAAS",
    audience: "BOTH",
    status: "COMING_SOON",
    pricingType: "SUBSCRIPTION",
    duration: "Monthly",
    mode: "ONLINE",
    benefits: ["Unified dashboard for programs and projects", "Built-in reporting"],
    tags: ["saas"],
  },
  {
    slug: "mobile-app-development",
    title: "Mobile App Development",
    shortDescription: "Native-quality iOS and Android apps from one codebase.",
    longDescription:
      "Cross-platform mobile apps built for real production use - not yet published while we finalize this offering's pricing structure.",
    category: "MOBILE_DEVELOPMENT",
    audience: "BUSINESS",
    status: "DRAFT",
    pricingType: "CUSTOM_QUOTE",
    duration: "10-14 Weeks",
    mode: "HYBRID",
    tags: ["mobile", "ios", "android"],
  },
];

async function main() {
  for (const offering of OFFERINGS) {
    await prisma.offering.upsert({
      where: { slug: offering.slug },
      create: offering,
      update: offering,
    });
  }
  console.log(`Seeded ${OFFERINGS.length} offerings.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
