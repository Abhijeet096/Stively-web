import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/shared/json-ld";
import { LegalPage, type LegalSection } from "@/features/legal/components/legal-page";

const TITLE = "Refund & Cancellation Policy";
const DESCRIPTION =
  "How refunds and cancellations work at Stively - milestone-based for custom software, and access-based for digital products and self-paced training.";
const EFFECTIVE_DATE = "22 July 2026";
const LAST_UPDATED = "15 September 2026";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/legal/refund-policy" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${siteConfig.url}/legal/refund-policy` },
};

const SECTIONS: LegalSection[] = [
  {
    id: "overview",
    heading: "Overview",
    body: (
      <>
        <p>
          Stively builds custom software - work that starts as soon as a project is confirmed and that,
          once built, has no resale value to anyone but the client it was built for. Because of that, our
          refund policy is milestone-based rather than a blanket &quot;refund anytime&quot; guarantee: what&apos;s
          refundable depends on how much of the agreed work has actually been done at the point you ask to
          cancel.
        </p>
        <p>
          This policy applies to every paid engagement with Stively - a fixed-price service package
          purchased at checkout, a custom-quoted, milestone-billed project, or a digital
          product/self-paced training course, each governed by the specific rules below that fit how it
          is actually delivered.
        </p>
      </>
    ),
  },
  {
    id: "fixed-price-packages",
    heading: "Fixed-price service packages",
    body: (
      <>
        <p>
          For fixed-price service offerings paid in full at checkout (for example, our Starter Website
          package - not our digital products or training courses, which follow a different rule below):
        </p>
        <ul>
          <li>
            <strong>Before work begins.</strong> If you cancel before we&apos;ve started any work on your
            project (typically within 24 hours of payment, before the discovery call has taken place), you
            are eligible for a full refund minus any payment gateway fees already deducted by Razorpay.
          </li>
          <li>
            <strong>After work begins.</strong> Once we&apos;ve started work - design, development, content
            setup, or any other project activity - the payment becomes non-refundable, because it covers
            time and work already committed to your project specifically. You&apos;ll still receive the
            deliverable we&apos;re contracted to build; this clause covers cancellation, not
            non-delivery (see <a href="#non-delivery">Non-delivery by Stively</a> below).
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "digital-products-and-training",
    heading: "Digital products and self-paced training",
    body: (
      <>
        <p>
          For digital products (downloadable resources like our AI prompt packs) and self-paced
          training courses (like our Generative AI &amp; Prompt Engineering Certification), payment is{" "}
          <strong>non-refundable once any part of the purchase has been accessed</strong> - meaning the
          file has been downloaded, or any lesson, video, or module in the course has been opened.
        </p>
        <p>
          This reflects how these products are actually delivered: access is granted automatically and
          immediately after payment, so there is no meaningful window between &quot;paid&quot; and
          &quot;delivered&quot; in practice. If you were charged in error, charged twice for the same
          purchase, or a genuine technical issue on our end prevented you from ever accessing what you
          paid for, contact us at <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>{" "}
          within 7 days of payment and we&apos;ll review it in good faith.
        </p>
        <p>
          Optional checkout add-ons purchased alongside a course (for example, a bonus prompt pack)
          follow this same rule independently - each item&apos;s refund eligibility is judged on whether
          that specific item has been accessed, not the order as a whole.
        </p>
      </>
    ),
  },
  {
    id: "milestone-projects",
    heading: "Custom, milestone-based projects",
    body: (
      <>
        <p>
          For custom-quoted projects billed in stages (advance payment, then further milestones tied to
          project phases - see our <a href="/process">Our Process</a> page):
        </p>
        <ul>
          <li>
            Each milestone payment covers the phase of work it&apos;s tied to. Once we&apos;ve started
            work on a milestone, the portion of that payment corresponding to completed work is
            non-refundable.
          </li>
          <li>
            If you cancel partway through a milestone, we&apos;ll calculate what&apos;s genuinely been
            completed against that milestone&apos;s scope and refund the unused portion, minus any
            third-party costs already incurred on your behalf (for example, a domain, hosting plan, or
            paid license purchased specifically for your project).
          </li>
          <li>
            Milestones already fully delivered and approved by you are not refundable once work on the
            next milestone has started, since that approval is what triggers the next phase of work.
          </li>
        </ul>
        <p>
          The specific milestone breakdown and what each covers is set out in your project proposal - that
          document, together with this policy, governs refunds for your engagement.
        </p>
      </>
    ),
  },
  {
    id: "consultation-fees",
    heading: "Consultation and advance fees",
    body: (
      <p>
        Where a consultation, discovery call, or advance/booking fee is charged separately from project
        milestones, it is non-refundable once the session has taken place or the time has been reserved,
        since it compensates us for time set aside and preparation done on your behalf. If you need to
        reschedule a booked consultation, contact us as early as possible and we&apos;ll do our best to
        find a new time at no extra cost.
      </p>
    ),
  },
  {
    id: "non-refundable",
    heading: "What's never refundable",
    body: (
      <ul>
        <li>Development, design, or other work already completed at the time of cancellation.</li>
        <li>Consultation time or discovery calls already delivered.</li>
        <li>Any digital product download or training course content already accessed.</li>
        <li>Third-party costs already incurred on your behalf (domains, hosting, paid APIs, licenses, plugins) once purchased.</li>
        <li>Payment gateway fees deducted by Razorpay on the original transaction, which are outside our control.</li>
      </ul>
    ),
  },
  {
    id: "cancellation-by-client",
    heading: "Cancellation by the client",
    body: (
      <p>
        You can request to cancel a project at any time by emailing{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>. We&apos;ll confirm
        what&apos;s been completed, what&apos;s still in progress, and calculate any eligible refund per
        the rules above within a reasonable time. Any work completed up to the point of cancellation - code,
        designs, or documents - will be handed over to you, since you&apos;ve paid for it.
      </p>
    ),
  },
  {
    id: "cancellation-by-stively",
    heading: "Cancellation by Stively",
    body: (
      <>
        <p>
          We may pause or cancel a project if: payment isn&apos;t received by an agreed due date, you
          repeatedly fail to provide the content, feedback, or access we need to continue (after we&apos;ve
          made reasonable attempts to reach you), or continuing the project would require us to do
          something unlawful or that violates these terms.
        </p>
        <p id="non-delivery">
          <strong>If we cancel a project without cause on our side</strong> - for reasons unrelated to the
          circumstances above - you&apos;ll receive a full refund of any milestone payment for work not yet
          delivered, and we&apos;ll hand over anything already completed.
        </p>
      </>
    ),
  },
  {
    id: "how-to-request",
    heading: "How to request a refund",
    body: (
      <p>
        Email <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a> with your order
        or project reference and the reason for your request. We aim to confirm eligibility within a few
        business days. Approved refunds are issued to the original Razorpay payment method and typically
        reflect in your account within 5-7 business days, depending on your bank or card issuer&apos;s own
        processing time - a timeline set by Razorpay and the banking network, not by us.
      </p>
    ),
  },
  {
    id: "related-policies",
    heading: "Related policies",
    body: (
      <p>
        This policy works together with our <a href="/legal/terms-of-service">Terms of Service</a> (which
        governs payment structure generally) and our <a href="/legal/delivery-policy">Delivery Policy</a>{" "}
        (which governs timelines). Where there&apos;s a conflict between this policy and a specific written
        proposal you&apos;ve agreed to, the proposal&apos;s terms take precedence for that project.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact us",
    body: (
      <p>
        Questions about a refund or cancellation can be sent to{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
      </p>
    ),
  },
];

export default function RefundPolicyPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
            { "@type": "ListItem", position: 2, name: "Refund & Cancellation Policy", item: `${siteConfig.url}/legal/refund-policy` },
          ],
        }}
      />
      <LegalPage
        title={TITLE}
        summary="Refunds at Stively follow how each purchase is actually delivered - milestone-based for custom software, access-based for digital products and self-paced training - not a blanket refund-anytime guarantee."
        effectiveDate={EFFECTIVE_DATE}
        lastUpdated={LAST_UPDATED}
        sections={SECTIONS}
      />
    </>
  );
}
