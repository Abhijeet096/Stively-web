import Link from "next/link";

import { siteConfig } from "@/config/site";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const FOOTER_LINKS = {
  Product: [
    { href: "/training", label: "Training" },
    { href: "/pricing", label: "Pricing" },
    { href: "/services", label: "Services" },
  ],
  Company: [
    { href: "/about", label: "About" },
    { href: "/careers", label: "Careers" },
    { href: "/contact", label: "Contact" },
  ],
  Legal: [
    { href: "/legal/privacy-policy", label: "Privacy Policy" },
    { href: "/legal/terms-of-service", label: "Terms of Service" },
    { href: "/legal/refund-policy", label: "Refund Policy" },
  ],
} as const;

/**
 * Deliberately quiet - the footer is a utility, not a place to reintroduce
 * visual flourish (see design-system.md §17). Newsletter form here is
 * presentational only; wire it to the `subscribeNewsletter` action when
 * this renders in a real page.
 */
function Footer() {
  return (
    <footer className="border-border border-t">
      <Container className="py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2 flex flex-col gap-4">
            <Logo />
            <p className="text-muted-foreground max-w-xs text-sm">{siteConfig.description}</p>
            <form className="flex max-w-sm gap-2" aria-label="Subscribe to the newsletter">
              <Input type="email" placeholder="you@email.com" aria-label="Email address" />
              <Button type="submit" variant="secondary">
                Subscribe
              </Button>
            </form>
          </div>

          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group} className="flex flex-col gap-3">
              <p className="text-foreground text-sm font-medium">{group}</p>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-150"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <Separator className="my-10" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a
              href={siteConfig.links.twitter}
              className="text-muted-foreground hover:text-foreground text-sm"
              target="_blank"
              rel="noreferrer"
            >
              Twitter
            </a>
            <a
              href={siteConfig.links.linkedin}
              className="text-muted-foreground hover:text-foreground text-sm"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
            <a
              href={siteConfig.links.instagram}
              className="text-muted-foreground hover:text-foreground text-sm"
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
