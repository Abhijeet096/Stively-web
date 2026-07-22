import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/shared/json-ld";
import { LegalPage, type LegalSection } from "@/features/legal/components/legal-page";

const TITLE = "Disclaimer";
const DESCRIPTION =
  "Limitations on what Stively's website, blog, and portfolio content can be relied on for.";
const EFFECTIVE_DATE = "22 July 2026";
const LAST_UPDATED = "22 July 2026";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/legal/disclaimer" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${siteConfig.url}/legal/disclaimer` },
};

const SECTIONS: LegalSection[] = [
  {
    id: "general",
    heading: "General",
    body: (
      <p>
        The information on {siteConfig.url} - including our blog, service pages, and portfolio - is
        provided in good faith for general informational purposes. It&apos;s not a substitute for advice
        specific to your situation, and using it doesn&apos;t create a client relationship with Stively
        unless you&apos;ve separately agreed to a proposal or purchased a service from us.
      </p>
    ),
  },
  {
    id: "no-guaranteed-outcomes",
    heading: "No guaranteed business outcomes",
    body: (
      <p>
        We build software to a professional standard, but we can&apos;t guarantee specific business
        results from it - search engine rankings, traffic volume, conversion rates, sales, or revenue all
        depend on many factors outside our control, including your market, competitors, and how the product
        is used after launch. Any figures, timelines, or outcomes discussed during a project conversation
        are estimates based on experience, not commitments unless explicitly written into your proposal.
      </p>
    ),
  },
  {
    id: "blog-educational-content",
    heading: "Blog and educational content",
    body: (
      <p>
        Articles and guides we publish are shared to be genuinely useful, but they reflect general
        practice at the time of writing and may not account for changes in technology, platforms, or best
        practice since publication. They aren&apos;t a substitute for a proper technical assessment of your
        specific project - if you&apos;re making a decision based on something we&apos;ve written, talk to
        us first.
      </p>
    ),
  },
  {
    id: "ai-assisted-content",
    heading: "AI-assisted content",
    body: (
      <p>
        Some written content on our site or blog may be drafted or researched with the assistance of AI
        tools and reviewed by our team before publishing. We don&apos;t represent AI-assisted content as
        independent professional advice, and we correct inaccuracies we become aware of - if you spot one,
        let us know at <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
      </p>
    ),
  },
  {
    id: "portfolio",
    heading: "Portfolio and case studies",
    body: (
      <p>
        Where a portfolio entry is explicitly labeled a &quot;Portfolio Concept,&quot; it&apos;s a project
        we designed and built ourselves to demonstrate our own capability - not commissioned or endorsed by
        a real client. Where a project is shown as client work, it reflects an engagement we actually
        delivered; we don&apos;t fabricate client work, logos, or testimonials.
      </p>
    ),
  },
  {
    id: "professional-advice",
    heading: "Not professional, legal, or financial advice",
    body: (
      <p>
        Nothing on this site constitutes legal, financial, tax, or investment advice. Our legal pages
        (including this one) describe how Stively operates - they&apos;re not a substitute for your own
        legal counsel if you need advice specific to your business or jurisdiction.
      </p>
    ),
  },
  {
    id: "third-party-links",
    heading: "Third-party links",
    body: (
      <p>
        Our site may link to external websites, including live projects we&apos;ve built for clients or
        concept projects. We don&apos;t control and aren&apos;t responsible for the content, availability,
        or practices of sites we don&apos;t operate.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "Changes to this disclaimer",
    body: (
      <p>
        We may update this page as our content practices evolve. The &quot;Last updated&quot; date above
        reflects the most recent revision.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact us",
    body: (
      <p>
        Questions about this disclaimer can be sent to{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
      </p>
    ),
  },
];

export default function DisclaimerPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
            { "@type": "ListItem", position: 2, name: "Disclaimer", item: `${siteConfig.url}/legal/disclaimer` },
          ],
        }}
      />
      <LegalPage
        title={TITLE}
        summary="What our website, blog, and portfolio content can and can't be relied on for."
        effectiveDate={EFFECTIVE_DATE}
        lastUpdated={LAST_UPDATED}
        sections={SECTIONS}
      />
    </>
  );
}
