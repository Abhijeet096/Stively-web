import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/shared/json-ld";
import { LegalPage, type LegalSection } from "@/features/legal/components/legal-page";

const TITLE = "Privacy Policy";
const DESCRIPTION =
  "How Stively collects, uses, stores, and protects your personal information across our website, contact forms, accounts, and payments.";
const EFFECTIVE_DATE = "22 July 2026";
const LAST_UPDATED = "22 July 2026";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/legal/privacy-policy" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${siteConfig.url}/legal/privacy-policy` },
};

const SECTIONS: LegalSection[] = [
  {
    id: "overview",
    heading: "Overview",
    body: (
      <>
        <p>
          Stively (&quot;Stively&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) builds
          websites, web applications, SaaS platforms, AI solutions, and related digital services for
          businesses. This Privacy Policy explains what personal information we collect through{" "}
          {siteConfig.url}, why we collect it, how it&apos;s used, who it&apos;s shared with, and the
          choices you have.
        </p>
        <p>
          This policy applies to visitors, prospective clients who contact us, registered users of our
          student/business portal, and clients who purchase a service through our website. If you don&apos;t
          agree with how we handle your information as described here, please don&apos;t use the site or
          submit your information to us.
        </p>
      </>
    ),
  },
  {
    id: "information-we-collect",
    heading: "Information we collect",
    body: (
      <>
        <p>We only collect information that a specific feature of the site actually needs to work:</p>
        <ul>
          <li>
            <strong>Account information.</strong> If you register or sign in, we collect your name,
            email address, and, if you sign in with a password rather than Google, a securely hashed
            password. We never store your password in plain text.
          </li>
          <li>
            <strong>Google account information.</strong> If you choose &quot;Continue with Google&quot;,
            Google shares your name, email address, and profile photo with us for the purpose of creating
            and signing you into your account. We don&apos;t receive your Google password.
          </li>
          <li>
            <strong>Contact and enquiry information.</strong> When you submit a contact form, request a
            proposal, or book a consultation, we collect what you provide - typically your name, email,
            phone number, company name (for business enquiries), and the details of your message or
            project.
          </li>
          <li>
            <strong>Order and payment information.</strong> When you purchase a service, we record the
            offering purchased, the amount, and a payment reference from our payment processor, Razorpay.
            We do not collect or store your card, UPI, or bank account details - Razorpay handles payment
            data directly and shares only the confirmation and reference we need to fulfil your order. See{" "}
            <a href="#payments">Payments</a> below.
          </li>
          <li>
            <strong>Usage information.</strong> Like most websites, we automatically collect some
            technical information when you visit - your IP address, browser and device type, pages
            viewed, and referring page - through Google Analytics. See{" "}
            <a href="/legal/cookie-policy">Cookie Policy</a> for details.
          </li>
          <li>
            <strong>Content you provide within the portal.</strong> If you have an account, we store the
            information tied to your use of the platform - your role, submitted assignments or requests,
            enrollment and order history, and any messages you send through the platform (for example, to
            an assigned mentor).
          </li>
        </ul>
        <p>
          We do not knowingly collect sensitive personal data such as health information, government ID
          numbers, or financial account details beyond what&apos;s described above.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-information",
    heading: "How we use your information",
    body: (
      <ul>
        <li>To create and maintain your account, and to authenticate you when you sign in.</li>
        <li>To respond to enquiries, proposals, and consultation requests.</li>
        <li>To process payments, confirm orders, and deliver the service you&apos;ve purchased.</li>
        <li>To send transactional communications - order confirmations, meeting notifications, account and security emails, and support responses.</li>
        <li>To understand how the site is used, so we can find and fix problems and improve it.</li>
        <li>To detect and prevent fraud, abuse, and security incidents (for example, locking an account after repeated failed sign-in attempts).</li>
        <li>To meet our legal, accounting, and tax obligations.</li>
      </ul>
    ),
  },
  {
    id: "cookies",
    heading: "Cookies and tracking",
    body: (
      <p>
        We use a small number of essential cookies to keep you signed in and secure, plus Google
        Analytics to understand site usage. We don&apos;t use advertising or cross-site tracking cookies.
        The full list of cookies we use, what each one does, and how to control them is in our{" "}
        <a href="/legal/cookie-policy">Cookie Policy</a>.
      </p>
    ),
  },
  {
    id: "payments",
    heading: "Payments",
    body: (
      <>
        <p>
          All online payments on Stively are processed by{" "}
          <a href="https://razorpay.com/" target="_blank" rel="noopener noreferrer">
            Razorpay
          </a>
          , a licensed payment aggregator regulated by the Reserve Bank of India. When you pay for a
          service, your card, UPI, net-banking, or wallet details are entered directly into Razorpay&apos;s
          secure checkout - they pass through Razorpay&apos;s systems, not ours, and we never see or store
          your full payment credentials.
        </p>
        <p>
          Razorpay shares a payment confirmation and a transaction reference with us so we can mark your
          order as paid and grant you access to what you purchased. Razorpay&apos;s own handling of your
          payment data is governed by{" "}
          <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer">
            Razorpay&apos;s Privacy Policy
          </a>
          , which we encourage you to review.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    heading: "Who we share information with",
    body: (
      <>
        <p>
          We don&apos;t sell your personal information, and we don&apos;t share it with third parties for
          their own marketing purposes. We share information only with the service providers that help us
          run Stively (our &quot;sub-processors&quot;), and only to the extent each one needs to do its job:
        </p>
        <ul>
          <li><strong>Razorpay</strong> - payment processing (see <a href="#payments">Payments</a> above).</li>
          <li><strong>Google</strong> - sign-in via Google OAuth, and Google Analytics for site usage insights.</li>
          <li><strong>Resend</strong> - delivery of transactional emails (verification, password reset, order and meeting notifications).</li>
          <li><strong>Neon</strong> - our managed PostgreSQL database provider, where account and platform data is stored.</li>
          <li><strong>Vercel</strong> - our hosting and infrastructure provider, which serves the website and runs our servers.</li>
        </ul>
        <p>
          We may also disclose information if required by law, to comply with a valid legal process, or
          to protect the rights, property, or safety of Stively, our users, or the public. If Stively is
          ever involved in a merger, acquisition, or sale of assets, user information may be transferred as
          part of that transaction - we&apos;d notify affected users before that happens.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    heading: "Data retention",
    body: (
      <p>
        We keep account and order information for as long as your account is active, and for a reasonable
        period afterward to meet accounting, tax, and legal record-keeping obligations. Contact form
        submissions that don&apos;t lead to an account are retained only as long as needed to respond to and
        follow up on the enquiry. You can ask us to delete your account and associated personal data at
        any time - see <a href="#your-rights">Your rights</a> below.
      </p>
    ),
  },
  {
    id: "security",
    heading: "Data security",
    body: (
      <>
        <p>
          We take reasonable technical and organizational measures to protect your information, including:
        </p>
        <ul>
          <li>Passwords are hashed (never stored in plain text) and accounts lock temporarily after repeated failed sign-in attempts.</li>
          <li>All traffic to the site is encrypted in transit (HTTPS), enforced with HSTS.</li>
          <li>The site sets a strict Content Security Policy and modern security headers to reduce the risk of common web attacks.</li>
          <li>Access to production data is limited to the people who need it to operate and support the platform.</li>
        </ul>
        <p>
          No method of transmission or storage is 100% secure, and we can&apos;t guarantee absolute
          security. If we become aware of a data breach affecting your personal information, we&apos;ll
          notify you and the relevant authorities as required by applicable law.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    heading: "Your rights",
    body: (
      <>
        <p>
          Depending on where you&apos;re located, you may have rights over your personal information,
          including the right to:
        </p>
        <ul>
          <li>Access the personal information we hold about you.</li>
          <li>Correct inaccurate or incomplete information.</li>
          <li>Request deletion of your account and personal data, subject to our legal retention obligations.</li>
          <li>Withdraw consent for optional processing (for example, by asking us not to send non-essential emails).</li>
          <li>Ask us who we&apos;ve shared your information with.</li>
        </ul>
        <p>
          To exercise any of these rights, email{" "}
          <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>. We&apos;ll respond
          within a reasonable time and may need to verify your identity before acting on your request.
        </p>
      </>
    ),
  },
  {
    id: "childrens-privacy",
    heading: "Children's privacy",
    body: (
      <p>
        Stively&apos;s services are intended for businesses and for students old enough to independently
        pursue training, internships, or project work. We don&apos;t knowingly collect personal information
        from children under 18. If you believe a child has provided us with personal information, contact
        us and we&apos;ll delete it.
      </p>
    ),
  },
  {
    id: "data-location",
    heading: "Where your data is stored",
    body: (
      <p>
        Our application and database infrastructure runs on cloud providers with data centers in the
        Asia-Pacific region. Because our service providers (see <a href="#sharing">above</a>) operate
        globally, your information may be processed in countries other than your own. Wherever it&apos;s
        processed, we require our providers to protect it consistently with this policy.
      </p>
    ),
  },
  {
    id: "third-party-links",
    heading: "Third-party links",
    body: (
      <p>
        Our site may link to third-party websites - for example, a client&apos;s live project, or a
        payment provider&apos;s checkout page. We aren&apos;t responsible for the privacy practices of sites
        we don&apos;t operate. We encourage you to review the privacy policy of any site you visit.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "Changes to this policy",
    body: (
      <p>
        We may update this policy as our services, tools, or legal obligations change. If we make a
        material change, we&apos;ll update the &quot;Last updated&quot; date above, and where appropriate,
        notify registered users by email. Continuing to use Stively after a change takes effect means you
        accept the updated policy.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact us",
    body: (
      <p>
        For any question about this policy or how we handle your information, contact us at{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>. We aim to respond to
        every privacy enquiry within a reasonable time, generally within a few business days.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
            { "@type": "ListItem", position: 2, name: "Privacy Policy", item: `${siteConfig.url}/legal/privacy-policy` },
          ],
        }}
      />
      <LegalPage
        title={TITLE}
        summary="What information we collect, why we collect it, and the choices you have - written in plain language, not boilerplate."
        effectiveDate={EFFECTIVE_DATE}
        lastUpdated={LAST_UPDATED}
        sections={SECTIONS}
      />
    </>
  );
}
