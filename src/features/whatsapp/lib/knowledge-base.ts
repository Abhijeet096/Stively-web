/**
 * The WhatsApp AI's entire source of truth - curated, version-controlled,
 * human-authored, never AI-generated. Same role a fixed grounding document
 * plays for the proposal chatbot (proposal-chat-engine.ts) and the AI tutor
 * (per-lesson blocks) - the model is instructed to answer ONLY from this
 * text (see reply-engine.ts's system prompt) and never invent anything not
 * present here.
 *
 * Every figure below is sourced directly from the real Offering rows
 * (prisma/seed-genai-course.ts, seed.ts, seed-digital-store.ts) and the real
 * /legal/refund-policy page content - not invented, not rounded, not
 * assumed. If Stively's actual pricing/inclusions change, THIS FILE must be
 * updated by a human alongside the seed data - the AI has no other source
 * and will not know about a change made anywhere else.
 *
 * Deliberately a plain TS object, not a CMS/database table (the audit's own
 * "do not create an unnecessary CMS for this") - this changes as rarely as
 * the seed data it mirrors, and a code review on a content PR is a better
 * accuracy gate than an admin form would be.
 */

export interface KnowledgeBaseOffering {
  slug: string;
  name: string;
  price: string;
  whatIncluded: string[];
  whatNotIncluded: string[];
}

export const GENAI_COURSE: KnowledgeBaseOffering = {
  slug: "generative-ai-prompt-engineering",
  name: "Generative AI & Prompt Engineering Certification",
  price: "₹499 (discounted from ₹999) - one-time payment, lifetime access",
  whatIncluded: [
    "Real recorded video lectures on Generative AI fundamentals and prompt engineering",
    "A written summary for every lesson",
    "A short quiz after each module - must score at least 50% to unlock the next module",
    "A Stively certificate on completion (see CERTIFICATE_INFO below)",
    "Lifetime access, including new modules added later at no extra cost",
    "Optional add-on at checkout: the 100+ Prompt Templates pack for an additional ₹199",
  ],
  whatNotIncluded: [
    "This course does NOT include a guaranteed internship or job placement",
    "This course does NOT include 1:1 mentoring - it is self-paced video + quiz",
    "No refund once any part of the course has been accessed - see REFUND_POLICY below",
  ],
};

export const FULL_STACK_TRAINING: KnowledgeBaseOffering = {
  slug: "full-stack-web-development",
  name: "Full Stack Web Development",
  price: "₹25,000 - cohort-based, 6 months",
  whatIncluded: [
    "A cohort-based program covering the full modern web stack, start to deploy",
    "6-month duration",
  ],
  whatNotIncluded: [
    "The Software Engineering Internship is a SEPARATE offering (see below) - completing this training does not automatically enroll you in it",
  ],
};

export const SOFTWARE_ENGINEERING_INTERNSHIP: KnowledgeBaseOffering = {
  slug: "software-engineering-internship",
  name: "Software Engineering Internship",
  price: "Free",
  whatIncluded: [
    "Real client project exposure alongside Stively's engineering team",
    "Mentor-guided code reviews",
    "A letter of recommendation for those who complete it",
    "3-month duration, hybrid mode, ~20 hours/week expected",
  ],
  whatNotIncluded: [
    "This is NOT a guaranteed job placement, and there is no guaranteed salary or stipend implied",
    "Requires working knowledge of at least one programming language - it is not an absolute-beginner program",
    "Intended for students who've completed a training program or equivalent self-study, not a standalone starting point",
  ],
};

export const DIGITAL_PRODUCTS: KnowledgeBaseOffering[] = [
  {
    slug: "100-practical-ai-prompts",
    name: "100 Practical AI Prompts",
    price: "₹99 - one-time payment",
    whatIncluded: [
      "100 ready-to-use AI prompts across 5 categories: Study & Learning, Career & Job Search, Work & Productivity, Content & Creativity, Business & Everyday Life",
      "Instant PDF download after payment, plus emailed download link",
      "Re-downloadable for 30 days from purchase",
    ],
    whatNotIncluded: [],
  },
  {
    slug: "500-ai-prompt-templates",
    name: "500 AI Prompt Templates",
    price: "₹199 - one-time payment",
    whatIncluded: [
      "203 ready-to-use AI prompts currently live, across 5 complete parts: Study & Learning, Career & Job Search, Work & Productivity, Writing & Communication, Content & Social Media",
      "A prompting-principles guide, a cheat sheet, and a build-your-own-prompt page",
      "7 more parts are planned and will be added to the same download at no extra cost once finished",
      "Instant PDF download after payment, plus emailed download link, re-downloadable for 30 days",
    ],
    whatNotIncluded: [
      "Do NOT describe this as \"500 prompts\" as if all 500 exist today - only 203 are live right now, with more planned. Always state this honestly if asked how many prompts are included.",
    ],
  },
];

export const CERTIFICATE_INFO = `Stively issues a certificate automatically once a student completes every module and passes every quiz in an eligible course (currently: Generative AI & Prompt Engineering Certification). The certificate has a unique certificate ID (format STV-GAI-YYYY-NNNNNN) and a QR code that links to a public verification page. Certificates can be downloaded as a PDF from the student's dashboard. There is no separate fee for the certificate - it's included in the course price. A certificate can be revoked by Stively if there was an issue with how it was issued; a revoked certificate no longer verifies as valid.`;

export const REFUND_POLICY = `Stively's refund policy is milestone/usage-based, not a blanket "refund anytime" guarantee:
- For a course or digital product (GenAI course, digital store products): once any part has been accessed/downloaded, the payment is non-refundable, since the deliverable has already been provided.
- Before any access has happened (typically within 24 hours of payment): eligible for a full refund minus any Razorpay payment gateway fees already deducted.
- For custom project engagements (agency work): refund eligibility depends on how much of the agreed milestone work has actually been completed - see the full policy at stively.com/legal/refund-policy.
- To request a refund: email team@stively.com with the order reference and reason. Approved refunds are issued to the original payment method, typically within 5-7 business days depending on the bank.
Never promise a refund outside these rules, and never promise a specific refund amount or timeline more precise than what's stated here - always point to team@stively.com for the actual decision.`;

export const PAYMENT_INFO = `All payments are processed securely through Razorpay. Stively accepts UPI, cards, netbanking, and wallets via Razorpay's checkout. Course/digital product purchases are one-time payments, not subscriptions. For custom agency projects, payment is typically milestone-based (an advance plus staged payments tied to project phases) - the exact structure is set in the project's written proposal, not a fixed rule.`;

export const AGENCY_SERVICES = `Stively also builds custom software for businesses - websites, web applications, CRM systems, AI automation, SEO, and cloud solutions. Agency work is always custom-scoped and quoted after a discovery conversation with a real person - there is no fixed price list, and the AI must never quote a price, timeline, or feature scope for agency/custom work. Any message that sounds like someone wants a website, app, or custom software built must be escalated to a human team member, not answered by the AI.`;

export const ESCALATION_CONTACT = `When escalating to a human, tell the customer: "Thanks - I've passed this to our team and someone from Stively will reach out to you shortly." Do not give a specific time promise (no "within 24 hours" unless that is separately confirmed policy). Stively's support email is team@stively.com.`;

/** Flattens the whole knowledge base into the single grounding block passed to every Groq call - see reply-engine.ts. */
export function buildKnowledgeBaseText(): string {
  const lines: string[] = [];

  const renderOffering = (o: KnowledgeBaseOffering) => {
    lines.push(`### ${o.name} (slug: ${o.slug})`, `Price: ${o.price}`, "What's included:");
    lines.push(...o.whatIncluded.map((i) => `- ${i}`));
    if (o.whatNotIncluded.length > 0) {
      lines.push("What's NOT included / important limits:");
      lines.push(...o.whatNotIncluded.map((i) => `- ${i}`));
    }
    lines.push("");
  };

  lines.push("## Courses");
  renderOffering(GENAI_COURSE);
  renderOffering(FULL_STACK_TRAINING);
  renderOffering(SOFTWARE_ENGINEERING_INTERNSHIP);

  lines.push("## Digital Store Products");
  DIGITAL_PRODUCTS.forEach(renderOffering);

  lines.push("## Certificates", CERTIFICATE_INFO, "");
  lines.push("## Refund Policy", REFUND_POLICY, "");
  lines.push("## Payment Information", PAYMENT_INFO, "");
  lines.push("## Agency / Custom Software Services", AGENCY_SERVICES, "");
  lines.push("## Human Escalation", ESCALATION_CONTACT, "");

  return lines.join("\n");
}
