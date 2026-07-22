import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/shared/json-ld";
import { LegalPage, type LegalSection } from "@/features/legal/components/legal-page";
import { Badge } from "@/components/ui/badge";

const TITLE = "Cookie Policy";
const DESCRIPTION =
  "The cookies Stively actually uses - essential sign-in cookies and Google Analytics. No advertising or cross-site tracking.";
const EFFECTIVE_DATE = "22 July 2026";
const LAST_UPDATED = "22 July 2026";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/legal/cookie-policy" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${siteConfig.url}/legal/cookie-policy` },
};

function CookieRow({ name, purpose, duration }: { name: string; purpose: string; duration: string }) {
  return (
    <div className="border-border flex flex-col gap-1 border-b py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <code className="bg-muted rounded px-1.5 py-0.5 text-sm">{name}</code>
        <Badge variant="outline" className="text-xs">
          {duration}
        </Badge>
      </div>
      <p className="text-muted-foreground text-sm">{purpose}</p>
    </div>
  );
}

const SECTIONS: LegalSection[] = [
  {
    id: "what-are-cookies",
    heading: "What cookies are",
    body: (
      <p>
        Cookies are small text files a website stores in your browser to remember information between
        visits - for example, that you&apos;re signed in. This page lists exactly which cookies Stively
        uses, what each one does, and how long it lasts. We keep this list short on purpose: we only set a
        cookie when a specific feature genuinely needs it.
      </p>
    ),
  },
  {
    id: "essential-cookies",
    heading: "Essential cookies",
    body: (
      <>
        <p>
          These cookies are required for the site&apos;s core functionality - signing in, staying signed
          in, and keeping your session secure. You can&apos;t opt out of these while remaining signed in,
          since they&apos;re what sign-in itself relies on.
        </p>
        <div>
          <CookieRow
            name="authjs.session-token"
            purpose="Keeps you signed in between page loads. Set when you sign in, removed when you sign out."
            duration="Up to 30 days (or 1 day if you don't choose 'remember me')"
          />
          <CookieRow
            name="authjs.csrf-token"
            purpose="A security token that protects the sign-in form from cross-site request forgery attacks."
            duration="Session"
          />
          <CookieRow
            name="authjs.callback-url"
            purpose="Remembers where to send you back to after completing sign-in."
            duration="Session"
          />
          <CookieRow
            name="stively_pending_role"
            purpose="Used only during Google sign-up, to remember whether you registered as a student or a business before Google redirects you back to us."
            duration="A few minutes, cleared automatically"
          />
        </div>
        <p>
          Exact cookie names are managed by our authentication library and may change slightly with
          software updates; their purpose - keeping you securely signed in - won&apos;t.
        </p>
      </>
    ),
  },
  {
    id: "analytics-cookies",
    heading: "Analytics cookies",
    body: (
      <>
        <p>
          We use Google Analytics to understand how visitors use the site - which pages get read, where
          visitors come from, and general usage trends - so we can improve it. These cookies are only
          loaded on the live production site, never during development or testing.
        </p>
        <div>
          <CookieRow
            name="_ga"
            purpose="Distinguishes unique visitors for Google Analytics reporting."
            duration="Up to 2 years"
          />
          <CookieRow
            name="_ga_<container-id>"
            purpose="Persists session state for Google Analytics 4 reporting."
            duration="Up to 2 years"
          />
        </div>
        <p>
          Google Analytics data is aggregated and used for our own understanding of site usage - we
          don&apos;t use it to build advertising profiles, and we don&apos;t share it with ad networks. See{" "}
          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
            how Google uses information from sites that use its services
          </a>{" "}
          for more detail.
        </p>
      </>
    ),
  },
  {
    id: "what-we-dont-use",
    heading: "What we don't use",
    body: (
      <p>
        We don&apos;t use advertising cookies, cross-site tracking pixels, or third-party marketing
        cookies. We don&apos;t sell or share cookie data with data brokers or ad networks. Your theme
        preference (light/dark mode, where available) is stored in your browser&apos;s local storage, not a
        cookie, and never leaves your device.
      </p>
    ),
  },
  {
    id: "third-party-cookies",
    heading: "Third-party cookies",
    body: (
      <p>
        When you pay through Razorpay&apos;s checkout, or sign in with Google, those services may set their
        own cookies within their own checkout window or sign-in flow, governed by{" "}
        <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer">
          Razorpay&apos;s
        </a>{" "}
        and{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          Google&apos;s
        </a>{" "}
        own privacy policies. We don&apos;t control these cookies and they&apos;re not covered by this
        policy.
      </p>
    ),
  },
  {
    id: "managing-cookies",
    heading: "Managing cookies",
    body: (
      <p>
        Most browsers let you view, delete, and block cookies through their settings. Blocking essential
        cookies will prevent you from staying signed in. You can also opt out of Google Analytics
        specifically using{" "}
        <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
          Google&apos;s browser add-on
        </a>
        .
      </p>
    ),
  },
  {
    id: "changes",
    heading: "Changes to this policy",
    body: (
      <p>
        If we add a new tool that sets a new type of cookie, we&apos;ll update this page and its
        &quot;Last updated&quot; date to reflect it, rather than leaving this list stale.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact us",
    body: (
      <p>
        Questions about cookies on Stively can be sent to{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
      </p>
    ),
  },
];

export default function CookiePolicyPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
            { "@type": "ListItem", position: 2, name: "Cookie Policy", item: `${siteConfig.url}/legal/cookie-policy` },
          ],
        }}
      />
      <LegalPage
        title={TITLE}
        summary="Every cookie Stively sets, listed by name - not a generic 'we may use cookies' disclaimer."
        effectiveDate={EFFECTIVE_DATE}
        lastUpdated={LAST_UPDATED}
        sections={SECTIONS}
      />
    </>
  );
}
