import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/shared/json-ld";
import { LegalPage, type LegalSection } from "@/features/legal/components/legal-page";

const TITLE = "Terms of Service";
const DESCRIPTION =
  "The terms that govern your use of Stively's website and services, including project workflow, payment, intellectual property, and liability.";
const EFFECTIVE_DATE = "22 July 2026";
const LAST_UPDATED = "22 July 2026";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/legal/terms-of-service" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${siteConfig.url}/legal/terms-of-service` },
};

const SECTIONS: LegalSection[] = [
  {
    id: "acceptance",
    heading: "Acceptance of these terms",
    body: (
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of {siteConfig.url} and
        any service you purchase or request through it (together, the &quot;Services&quot;). By using the
        site, creating an account, submitting a request, or making a payment, you agree to these Terms. If
        you&apos;re agreeing on behalf of a business, you confirm you have the authority to bind that
        business to these Terms.
      </p>
    ),
  },
  {
    id: "who-we-serve",
    heading: "Who these terms apply to",
    body: (
      <p>
        Stively serves two audiences under one platform: businesses purchasing software development and
        related services, and students engaging with our training, internship, and mentorship programs.
        Sections of these Terms that specifically concern paid client services (project scope, payment
        terms, delivery, intellectual property) apply to business clients; general terms (accounts,
        acceptable use, liability, governing law) apply to everyone.
      </p>
    ),
  },
  {
    id: "services",
    heading: "Services we provide",
    body: (
      <>
        <p>Stively provides custom software development and related services, including:</p>
        <ul>
          <li>Website development and redesign</li>
          <li>Custom web application and SaaS platform development</li>
          <li>AI-driven features and automation</li>
          <li>UI/UX design</li>
          <li>API development and third-party systems integration</li>
          <li>Search engine optimization (SEO)</li>
          <li>Website maintenance and support</li>
          <li>Business process automation</li>
        </ul>
        <p>
          The exact scope of any engagement is defined in the proposal, quote, or offering description you
          agree to before work begins - these Terms govern the relationship generally, but a specific
          project&apos;s scope, price, and timeline are set out separately.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    heading: "Accounts",
    body: (
      <>
        <p>
          Some parts of the site require an account. You&apos;re responsible for keeping your login
          credentials confidential and for all activity that happens under your account. Tell us
          immediately at <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a> if you
          believe your account has been accessed without your permission.
        </p>
        <p>
          You must provide accurate information when creating an account or submitting a request, and keep
          it up to date. We may suspend or terminate an account that provides false information, is used
          for fraud or abuse, or otherwise violates these Terms.
        </p>
      </>
    ),
  },
  {
    id: "project-workflow",
    heading: "Project workflow",
    body: (
      <>
        <p>
          A typical client engagement runs through the stages described on our{" "}
          <a href="/process">Our Process</a> page: a discovery conversation, requirement analysis, a
          proposal and fixed quote, an advance payment to begin, design, development, testing, deployment,
          and a defined post-launch support period. We follow this sequence so scope and cost are agreed
          before work starts, not discovered afterward.
        </p>
        <p>
          Work on any stage beyond Discovery and Proposal begins only once the corresponding payment
          milestone (see <a href="#payment-terms">Payment terms</a>) has been received.
        </p>
      </>
    ),
  },
  {
    id: "client-responsibilities",
    heading: "Client responsibilities",
    body: (
      <>
        <p>To deliver a project on schedule, we depend on the client to:</p>
        <ul>
          <li>Provide complete and accurate project requirements, content, brand assets, and access credentials needed for the work.</li>
          <li>Respond to review requests, approvals, and questions within the timeframe agreed in the proposal.</li>
          <li>Pay invoices by their due date.</li>
          <li>Have the legal right to use any content, trademarks, or third-party material provided to us for the project.</li>
        </ul>
        <p>
          Delays caused by late feedback, missing content, or unavailable stakeholders on the client&apos;s
          side may extend the delivery timeline correspondingly - see{" "}
          <a href="/legal/delivery-policy">Delivery Policy</a>.
        </p>
      </>
    ),
  },
  {
    id: "intellectual-property",
    heading: "Intellectual property",
    body: (
      <>
        <p>
          Unless the proposal for your project states otherwise, once a project is paid in full,
          ownership of the final deliverables - the source code, design files, and content created
          specifically for your project - transfers to you. Before final payment, Stively retains
          ownership of all work in progress.
        </p>
        <p>
          Stively retains the right to reuse general-purpose code, components, tools, and know-how that
          aren&apos;t specific to your project (for example, internal frameworks or utilities we&apos;ve
          built and reuse across engagements), even after a project is complete.
        </p>
        <p>
          You retain ownership of any content, data, trademarks, or brand assets you provide to us for the
          project. Unless you ask us not to, we may reference the fact that we built your project (and
          link to it) as part of our own portfolio.
        </p>
      </>
    ),
  },
  {
    id: "payment-terms",
    heading: "Payment terms",
    body: (
      <>
        <p>
          Prices are quoted in Indian Rupees (INR) unless stated otherwise. Payments are processed
          securely through Razorpay - see our <a href="/legal/privacy-policy#payments">Privacy Policy</a>{" "}
          for how payment information is handled.
        </p>
        <p>Depending on the offering, payment follows one of two structures:</p>
        <ul>
          <li>
            <strong>Fixed-price packages</strong> (for example, our Starter Website package) are paid in
            full at checkout before work begins.
          </li>
          <li>
            <strong>Custom-quoted projects</strong> are typically paid in milestones - an advance payment
            to begin work, followed by further payments tied to project stages, as set out in your
            proposal. The exact milestone structure is confirmed in writing before work starts.
          </li>
        </ul>
        <p>
          Late payment may pause project work until the outstanding amount is settled. Our refund and
          cancellation terms - including what is and isn&apos;t refundable once work has started - are set
          out separately in our <a href="/legal/refund-policy">Refund &amp; Cancellation Policy</a>, which
          forms part of these Terms.
        </p>
      </>
    ),
  },
  {
    id: "delivery",
    heading: "Delivery timelines",
    body: (
      <p>
        Estimated delivery timelines are provided in your proposal or offering description and depend on
        project scope, complexity, and how quickly the client provides feedback and content. Timelines are
        estimates, not guarantees, unless a specific delivery date is explicitly agreed in writing. See our{" "}
        <a href="/legal/delivery-policy">Delivery Policy</a> for more detail.
      </p>
    ),
  },
  {
    id: "acceptable-use",
    heading: "Acceptable use",
    body: (
      <>
        <p>You agree not to use Stively&apos;s site or services to:</p>
        <ul>
          <li>Violate any applicable law or regulation.</li>
          <li>Infringe anyone else&apos;s intellectual property or privacy rights.</li>
          <li>Upload or transmit malicious code, or attempt to gain unauthorized access to our systems.</li>
          <li>Interfere with the normal operation of the site or the experience of other users.</li>
          <li>Misrepresent your identity or affiliation.</li>
        </ul>
      </>
    ),
  },
  {
    id: "warranties-disclaimers",
    heading: "Warranties and disclaimers",
    body: (
      <>
        <p>
          We build every project to a professional standard and stand behind the quality of our work. That
          said, our services are provided on an &quot;as is&quot; and &quot;as available&quot; basis, and we
          don&apos;t guarantee that any software will be entirely error-free or uninterrupted, or that it
          will achieve a particular business outcome (for example, a specific volume of traffic, sales, or
          search ranking) - see our <a href="/legal/disclaimer">Disclaimer</a> for more on this.
        </p>
        <p>
          Any warranty on delivered work (for example, fixing defects introduced by us within a defined
          support window) is as stated in your specific proposal or offering description, not implied
          beyond what&apos;s written there.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    heading: "Limitation of liability",
    body: (
      <>
        <p>
          To the maximum extent permitted by law, Stively&apos;s total liability arising out of or relating
          to a project or these Terms is limited to the amount you actually paid us for that specific
          project in the twelve months before the claim arose.
        </p>
        <p>
          We aren&apos;t liable for indirect, incidental, special, or consequential damages - including
          lost profits, lost data, or business interruption - arising from your use of our services, even
          if we&apos;ve been advised of the possibility of such damages.
        </p>
        <p>
          Nothing in these Terms limits liability that cannot be excluded under applicable Indian law,
          including liability for fraud or willful misconduct.
        </p>
      </>
    ),
  },
  {
    id: "indemnification",
    heading: "Indemnification",
    body: (
      <p>
        You agree to indemnify and hold Stively harmless from any claim, loss, or expense (including
        reasonable legal fees) arising from content, data, or materials you provide to us, your breach of
        these Terms, or your violation of any law or third-party right in connection with your use of our
        services.
      </p>
    ),
  },
  {
    id: "termination",
    heading: "Termination",
    body: (
      <p>
        You may stop using our site and close your account at any time. We may suspend or terminate access
        to the site or a project if these Terms are violated, if payment isn&apos;t received, or if
        continuing would expose Stively to legal or security risk. Termination of an active project follows
        the process described in our{" "}
        <a href="/legal/refund-policy">Refund &amp; Cancellation Policy</a>.
      </p>
    ),
  },
  {
    id: "governing-law",
    heading: "Governing law and jurisdiction",
    body: (
      <p>
        These Terms are governed by the laws of India, without regard to its conflict-of-law principles.
        Any dispute arising out of or relating to these Terms or our services shall be subject to the
        exclusive jurisdiction of the competent courts of India.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "Changes to these terms",
    body: (
      <p>
        We may update these Terms from time to time. If we make a material change, we&apos;ll update the
        &quot;Last updated&quot; date above and, where appropriate, notify registered users. Continuing to
        use Stively after a change takes effect means you accept the updated Terms. Terms already agreed
        for an active project continue to apply to that project unless we agree otherwise in writing.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact us",
    body: (
      <p>
        Questions about these Terms can be sent to{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
      </p>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
            { "@type": "ListItem", position: 2, name: "Terms of Service", item: `${siteConfig.url}/legal/terms-of-service` },
          ],
        }}
      />
      <LegalPage
        title={TITLE}
        summary="The terms that govern your use of our website and any service you purchase from us."
        effectiveDate={EFFECTIVE_DATE}
        lastUpdated={LAST_UPDATED}
        sections={SECTIONS}
      />
    </>
  );
}
