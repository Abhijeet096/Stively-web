import {
  Clock,
  Zap,
  EyeOff,
  Lock,
  Code2,
  Search,
  KeyRound,
  Smartphone,
  Gauge,
  Pencil,
  BarChart3,
  ShieldCheck,
  Mail,
  TrendingUp,
  HeartPulse,
  GraduationCap,
  Landmark,
  Building,
  UtensilsCrossed,
  HardHat,
  Plane,
  Truck,
  Factory,
  Rocket,
  Cloud,
  Building2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Industry } from "@/components/sections/industries-grid";
import type { ProcessStep } from "@/components/sections/process-timeline";
import type { Reason } from "@/components/sections/why-choose-stively";
import type { FAQItem } from "@/components/sections/faq-section";

export interface IconPoint {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const PROBLEM_POINTS: IconPoint[] = [
  {
    icon: Clock,
    title: "Built once, then abandoned",
    description:
      "Template sites tend to ship and freeze. Content goes stale, nobody on your team can safely touch the code, and a small update turns into a support ticket to an agency that's moved on.",
  },
  {
    icon: Zap,
    title: "Slow enough to lose visitors before they see anything",
    description:
      "Page builders load megabytes of styling and scripts a browser doesn't need. On mobile, on a real connection, that's the difference between a visitor staying and one who's already gone.",
  },
  {
    icon: EyeOff,
    title: "Invisible to the search engines that matter",
    description:
      "Without semantic markup, proper metadata, and a real sitemap, a site can look fine and still be functionally unreadable to Google - so it never gets a fair shot at ranking.",
  },
  {
    icon: Lock,
    title: "You don't actually own it",
    description:
      "Some agencies build inside their own CMS account, their own hosting, their own domain registrar login. Leave, and you're rebuilding from zero - not migrating.",
  },
];

export const SOLUTION_POINTS: IconPoint[] = [
  {
    icon: Code2,
    title: "Real code, not a page-builder",
    description:
      "Every site is hand-built on Next.js and React - the same stack production software runs on. Any competent developer can open the codebase and understand it, including one who isn't us.",
  },
  {
    icon: Zap,
    title: "Performance is a requirement, not an afterthought",
    description:
      "Image optimization, code splitting, and server rendering are the default, not an upsell. A slow site is treated as a bug, the same way we'd treat one in any other product.",
  },
  {
    icon: Search,
    title: "SEO built in from the first commit",
    description:
      "Semantic HTML, per-page metadata, structured data, and a real XML sitemap ship with the site on day one - not bolted on after launch once someone notices traffic isn't coming.",
  },
  {
    icon: KeyRound,
    title: "You hold every key",
    description:
      "Source code in a repository you control, hosting under your own account, your domain untouched. If you ever want to leave, there's nothing to negotiate - it's already yours.",
  },
];

export const PROCESS_STEPS: ProcessStep[] = [
  {
    title: "Discovery",
    description:
      "A working conversation about what the site actually needs to do for your business - not a generic questionnaire.",
  },
  {
    title: "Planning",
    description:
      "Sitemap, page-by-page scope, and a fixed estimate you approve before a line of code is written.",
  },
  {
    title: "UI design",
    description:
      "Real screens for your actual content and brand - reviewed and revised with you before development starts.",
  },
  {
    title: "Development",
    description:
      "Built in visible stages on a staging link you can check in on, not a black box until the reveal.",
  },
  {
    title: "Testing",
    description:
      "Checked across real devices and browsers, and against accessibility and performance standards before anything ships.",
  },
  {
    title: "Deployment",
    description: "Launched onto infrastructure you control, with DNS and hosting handed to you cleanly.",
  },
  {
    title: "Support",
    description:
      "A month of post-launch support is included to fix anything that comes up once real users start clicking around.",
  },
];

export const FEATURES: IconPoint[] = [
  {
    icon: Smartphone,
    title: "Responsive on every device",
    description:
      "Designed mobile-first and checked on real phones and tablets, not just resized in a desktop browser.",
  },
  {
    icon: Search,
    title: "SEO foundation, not an afterthought",
    description: "Semantic HTML, metadata, sitemap, and structured data on every page from launch.",
  },
  {
    icon: Gauge,
    title: "Built for speed",
    description: "Optimized images, minimal JavaScript, and server rendering keep load times low by default.",
  },
  {
    icon: Pencil,
    title: "Content you can manage yourself",
    description: "Update copy, images, and pages without filing a support ticket for every small change.",
  },
  {
    icon: BarChart3,
    title: "Analytics from day one",
    description: "Google Analytics wired in at launch, so you're not flying blind on your own traffic.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by default",
    description: "HTTPS, modern security headers, and safe defaults - not something retrofitted after a scare.",
  },
  {
    icon: Mail,
    title: "Lead capture built in",
    description: "Contact and enquiry forms that route straight to you, ready from the moment the site goes live.",
  },
  {
    icon: TrendingUp,
    title: "Room to grow",
    description: "Built on the same stack we use for full applications, so adding features later doesn't mean starting over.",
  },
];

export const BENEFITS: Reason[] = [
  {
    icon: Gauge,
    title: "A faster site keeps more visitors",
    description:
      "Every extra second of load time pushes visitors to leave before they see what you offer - speed is a conversion lever, not a vanity metric.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first reaches more of your market",
    description:
      "Most first visits now happen on a phone. A site that only really works on desktop is quietly turning away a majority of its traffic.",
  },
  {
    icon: TrendingUp,
    title: "A real SEO foundation compounds over time",
    description:
      "Organic search traffic doesn't cost per click. Built correctly from launch, a site keeps earning visibility months and years later.",
  },
  {
    icon: KeyRound,
    title: "Ownership removes vendor risk",
    description:
      "When the code, hosting, and domain are yours, no single vendor relationship can hold your business hostage.",
  },
];

export const INDUSTRIES: Industry[] = [
  { icon: HeartPulse, label: "Healthcare" },
  { icon: GraduationCap, label: "Education" },
  { icon: Landmark, label: "FinTech" },
  { icon: Building, label: "Real Estate" },
  { icon: UtensilsCrossed, label: "Restaurants" },
  { icon: HardHat, label: "Construction" },
  { icon: Plane, label: "Travel" },
  { icon: Truck, label: "Logistics" },
  { icon: Factory, label: "Manufacturing" },
  { icon: Rocket, label: "Startups" },
  { icon: Cloud, label: "SaaS" },
  { icon: Building2, label: "Enterprise" },
];

export const WHY_US_POINTS: IconPoint[] = [
  {
    icon: Clock,
    title: "Real timelines, held honestly",
    description:
      "If something is going to slip, you hear it before the deadline passes, not after - with a reason and a revised date, not silence.",
  },
  {
    icon: Code2,
    title: "A developer in every review call",
    description:
      "You talk to the person actually building your site, not a relay through an account manager who has to go find out.",
  },
  {
    icon: ShieldCheck,
    title: "We'll say when you don't need us",
    description:
      "If a lighter, off-the-shelf solution genuinely fits your situation better than a custom build, we'll tell you - even when it means a smaller invoice.",
  },
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How much does website development cost?",
    answer:
      "The Starter Website package starts at ₹8,999 for a responsive, SEO-ready site of up to 5 pages. Larger builds - custom design, a CMS, e-commerce, or an admin panel - are scoped and quoted individually once we understand what you need. See the full pricing breakdown on our Pricing page.",
  },
  {
    question: "How long does it take to build a website?",
    answer:
      "The Starter Website package ships in 2-3 weeks. Larger, custom-scoped projects get a concrete timeline as part of the proposal, before any work starts - it depends entirely on the number of pages, integrations, and design complexity.",
  },
  {
    question: "Will I own the website and its code once it's built?",
    answer:
      "Yes, completely. Source code, hosting, and your domain stay under your own accounts. There's no proprietary lock-in and nothing to negotiate if you ever want to move the site elsewhere.",
  },
  {
    question: "Will my website actually rank on Google?",
    answer:
      "Every site we build ships with a real technical SEO foundation - semantic HTML, proper metadata, a sitemap, and structured data. That gives you a fair shot at ranking; how competitive your specific keywords are is a separate conversation we're happy to have upfront.",
  },
  {
    question: "Can you redesign or rebuild my existing website instead of starting from scratch?",
    answer:
      "Yes. We'll review what you have, figure out what's worth keeping (content, structure, existing rankings) and what's holding it back, and scope a rebuild that doesn't throw away what's already working.",
  },
  {
    question: "What technology do you build websites on?",
    answer:
      "Next.js, React, and TypeScript on the frontend, with Node.js, Prisma, and PostgreSQL when a site needs a real backend. This is a modern, widely-supported stack - not a proprietary builder only we can maintain.",
  },
  {
    question: "Will the website work properly on mobile phones?",
    answer:
      "Yes - every site is designed mobile-first and tested on real devices, not just a resized browser window. Most first-time visitors arrive on a phone, so this isn't treated as optional.",
  },
  {
    question: "Do you provide hosting, or do I need my own?",
    answer:
      "We deploy to hosting under your own account (typically Vercel or AWS) so you retain full control and never depend on us to keep your site online. We'll set it up and walk you through it.",
  },
  {
    question: "What happens after the website launches - is there support?",
    answer:
      "The Starter Website package includes a month of post-launch support to fix anything that comes up once real users are on the site. Larger packages include longer support windows, and ongoing maintenance can be arranged separately.",
  },
  {
    question: "Can I update the content myself after the site is live?",
    answer:
      "Yes - sites are built so you can manage copy, images, and pages without needing to file a support ticket for every small change. If your project needs a full CMS, that's scoped as part of the Business tier and above.",
  },
  {
    question: "Do you build e-commerce functionality into a website?",
    answer:
      "Yes - product catalogs, payment gateway integration, and order handling are part of our Enterprise Solution package, and can also be scoped individually for a custom project.",
  },
  {
    question: "Is pricing fixed, or billed hourly?",
    answer:
      "Fixed. You approve a scope and a price before work starts, so there's no surprise invoice at the end. If your requirements genuinely grow mid-project, that's scoped and agreed as a separate addition, not folded silently into the original quote.",
  },
  {
    question: "Do you sign an NDA before discussing my project?",
    answer: "Yes - happy to sign one before we get into any specifics.",
  },
  {
    question: "What if my requirements change partway through the project?",
    answer:
      "That's normal, not a problem. Projects are planned in stages specifically so a change in one stage doesn't mean redoing everything that came before it.",
  },
  {
    question: "What's the difference between the Starter, Business, and Enterprise packages?",
    answer:
      "Starter is a fast, fixed-scope site for a business that needs to get online well. Business adds custom design, a CMS, a blog, and deeper SEO and API work for a growing company. Enterprise bundles a full platform - website, e-commerce, admin panel, and a mobile app - for businesses that need more than a site.",
  },
  {
    question: "Do you handle domain and DNS setup?",
    answer:
      "Yes - we'll guide you through connecting your domain and configuring DNS as part of deployment, or handle it directly if you'd rather not deal with it.",
  },
  {
    question: "How do I get started?",
    answer:
      "Send us a message through the contact form or WhatsApp with a short description of what you need. We'll reply within a day to set up a discovery conversation - no obligation, no hard sell.",
  },
];
