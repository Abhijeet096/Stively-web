import Link from "next/link";

import { siteConfig, B2B_ONLY_MODE } from "@/config/site";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// "/careers" omitted - planned (see docs/phase-a-product-plan.md) but not
// built yet, and a live footer link pointing at a 404 is worse than no
// link. "/pricing" shipped, so it's back in Product below.
const FOOTER_LINKS = {
  Product: [
    { href: "/services", label: "Services" },
    { href: "/work", label: "Our Work" },
    { href: "/pricing", label: "Pricing" },
    ...(B2B_ONLY_MODE ? [] : [{ href: "/training", label: "Training" }]),
  ],
  Company: [
    { href: "/about", label: "About" },
    { href: "/process", label: "Our Process" },
    { href: "/contact", label: "Contact" },
  ],
  // All six now real pages (previously flagged as a pre-launch compliance
  // gap - the site collects PII via the Contact form, newsletter signup,
  // and Razorpay payments with no linked policies anywhere).
  Legal: [
    { href: "/legal/privacy-policy", label: "Privacy Policy" },
    { href: "/legal/terms-of-service", label: "Terms of Service" },
    { href: "/legal/refund-policy", label: "Refund & Cancellation" },
    { href: "/legal/delivery-policy", label: "Delivery Policy" },
    { href: "/legal/cookie-policy", label: "Cookie Policy" },
    { href: "/legal/disclaimer", label: "Disclaimer" },
  ],
} as const;

/**
 * Closes the page on the same --ink surface as Hero/Process/the closing
 * CTA - the third of three deliberately dark bookends (see globals.css's
 * --ink token block), not a one-off dark treatment. Still structurally
 * quiet (no new content, same link groups, same newsletter form) - only
 * the surface changed, per this phase's visual-only scope. Newsletter form
 * is still presentational only; wire it to the `subscribeNewsletter`
 * action when this renders in a real page.
 */
function Footer() {
  return (
    <footer className="bg-ink text-ink-foreground texture-noise relative overflow-hidden">
      {/* Hairline gradient seam at the top edge, both brand colors - the
          "accent line" that announces this surface change instead of a
          plain border. */}
      <div
        aria-hidden="true"
        className="from-primary via-brand-iris to-brand-teal absolute inset-x-0 top-0 h-px bg-linear-to-r opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 700px 420px at 8% 0%, oklch(0.541 0.216 265.75 / 0.16), transparent 60%)," +
            "radial-gradient(ellipse 600px 380px at 95% 100%, oklch(0.746 0.127 200.01 / 0.1), transparent 60%)",
        }}
      />
      <Container className="relative py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-5 md:gap-10">
          <div className="md:col-span-2 flex flex-col gap-4">
            <Logo variant="dark" />
            <p className="text-ink-muted-foreground max-w-xs text-sm text-pretty">
              {siteConfig.description}
            </p>
            <form className="flex max-w-sm gap-2" aria-label="Subscribe to the newsletter">
              <Input
                type="email"
                placeholder="you@email.com"
                aria-label="Email address"
                autoComplete="email"
                // Password-manager/form-fill browser extensions (LastPass,
                // Dashlane, etc.) inject a fdprocessedid attribute onto
                // form fields before React hydrates - a real mismatch, but
                // one the extension caused client-side, not our SSR output.
                // See https://react.dev/link/hydration-mismatch.
                suppressHydrationWarning
                className="border-ink-border-strong bg-white/[0.04] text-ink-foreground placeholder:text-ink-muted-foreground/60 focus-visible:border-ink-foreground/40 rounded-full px-4"
              />
              <Button type="submit" variant="inverse" suppressHydrationWarning>
                Subscribe
              </Button>
            </form>
          </div>

          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group} className="flex flex-col gap-3">
              <p className="text-ink-muted-foreground/70 text-xs font-medium tracking-wide uppercase">
                {group}
              </p>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-ink-muted-foreground hover:text-ink-foreground text-sm transition-colors duration-150"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <Separator className="bg-ink-border my-10" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-ink-muted-foreground/80 text-sm">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex gap-6">
            {siteConfig.links.twitter && (
              <a
                href={siteConfig.links.twitter}
                className="text-ink-muted-foreground hover:text-ink-foreground text-sm transition-colors duration-150"
                target="_blank"
                rel="noreferrer"
              >
                Twitter
              </a>
            )}
            <a
              href={siteConfig.links.linkedin}
              className="text-ink-muted-foreground hover:text-ink-foreground text-sm transition-colors duration-150"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
            <a
              href={siteConfig.links.instagram}
              className="text-ink-muted-foreground hover:text-ink-foreground text-sm transition-colors duration-150"
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export { Footer };
