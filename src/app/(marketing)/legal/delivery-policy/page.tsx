import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/shared/json-ld";
import { LegalPage, type LegalSection } from "@/features/legal/components/legal-page";

const TITLE = "Delivery Policy";
const DESCRIPTION =
  "How Stively delivers digital work - deployment, handover, timelines, and post-launch support.";
const EFFECTIVE_DATE = "22 July 2026";
const LAST_UPDATED = "22 July 2026";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/legal/delivery-policy" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${siteConfig.url}/legal/delivery-policy` },
};

const SECTIONS: LegalSection[] = [
  {
    id: "overview",
    heading: "Overview",
    body: (
      <p>
        Everything Stively builds is delivered digitally - there&apos;s no physical product to ship. This
        policy explains what &quot;delivery&quot; actually means for a website, application, or platform we
        build for you, how long it typically takes, and what happens after launch.
      </p>
    ),
  },
  {
    id: "what-delivery-means",
    heading: "What delivery means",
    body: (
      <>
        <p>For a Stively project, delivery means all of the following have happened:</p>
        <ul>
          <li>The website or application is deployed and live on hosting infrastructure you control.</li>
          <li>Your domain is connected and working, if a domain was part of the project.</li>
          <li>Source code access is handed over (see <a href="/legal/terms-of-service#intellectual-property">Intellectual Property</a> in our Terms of Service).</li>
          <li>You&apos;ve been walked through the final result and how to use or manage it.</li>
        </ul>
        <p>
          A project isn&apos;t considered delivered simply because development work is &quot;finished&quot;
          internally - it&apos;s delivered once it&apos;s live and in your hands.
        </p>
      </>
    ),
  },
  {
    id: "timelines",
    heading: "Delivery timelines",
    body: (
      <>
        <p>
          For fixed-scope packages (for example, our Starter Website package), the delivery window is
          stated on the offering itself and starts once payment is confirmed. For custom-quoted projects,
          the timeline is set out in your proposal, based on the specific scope agreed.
        </p>
        <p>Timelines assume the client side of the project keeps pace - specifically:</p>
        <ul>
          <li>Content, brand assets, and any required access or credentials are provided when requested.</li>
          <li>Feedback and approvals on design/development milestones are given within the window agreed in the proposal.</li>
          <li>Any third-party accounts we need (domain registrar, hosting, payment gateway, external APIs) are made available promptly.</li>
        </ul>
        <p>
          Where the client side of a project is delayed, the delivery timeline moves out by a
          corresponding amount - a delay in receiving content or approvals isn&apos;t a delay in our
          delivery commitment.
        </p>
      </>
    ),
  },
  {
    id: "deployment",
    heading: "Deployment and handover",
    body: (
      <p>
        We deploy projects to modern, reliable hosting infrastructure (typically Vercel or AWS) under
        accounts you own, not ours - so you&apos;re never dependent on us to keep your own site online. If
        a project requires infrastructure we manage temporarily during development, ownership and access
        are transferred to you as part of delivery.
      </p>
    ),
  },
  {
    id: "post-launch-support",
    heading: "Post-launch support",
    body: (
      <p>
        Every project includes a defined post-launch support window (stated in your offering or proposal)
        during which we fix defects in the delivered work at no extra cost. Support beyond that window - new
        features, content changes, or ongoing maintenance - can be arranged separately as a new engagement
        or a maintenance plan.
      </p>
    ),
  },
  {
    id: "delays",
    heading: "If a delay happens",
    body: (
      <p>
        If we anticipate missing an agreed delivery date for reasons on our side, we&apos;ll tell you
        before the date passes, with a reason and a revised estimate - not after. Repeated or unreasonable
        delay caused by us is grounds for cancellation under our{" "}
        <a href="/legal/refund-policy">Refund &amp; Cancellation Policy</a>.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact us",
    body: (
      <p>
        Questions about a specific project&apos;s delivery can be sent to{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
      </p>
    ),
  },
];

export default function DeliveryPolicyPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
            { "@type": "ListItem", position: 2, name: "Delivery Policy", item: `${siteConfig.url}/legal/delivery-policy` },
          ],
        }}
      />
      <LegalPage
        title={TITLE}
        summary="What 'delivered' means for a Stively project, how timelines work, and what's covered after launch."
        effectiveDate={EFFECTIVE_DATE}
        lastUpdated={LAST_UPDATED}
        sections={SECTIONS}
      />
    </>
  );
}
