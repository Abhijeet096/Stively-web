"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetClose } from "@/components/ui/sheet";

// "/careers" is planned (see docs/phase-a-product-plan.md) but not built
// yet - a live nav item pointing at a 404 is worse than a nav item that
// doesn't exist yet. Add back once it ships. "/pricing" shipped - see it
// re-added below.
const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/work", label: "Our Work" },
  { href: "/pricing", label: "Pricing" },
  { href: "/training", label: "Training" },
] as const;

export interface NavbarProps {
  /**
   * The signed-in visitor's role-home path (e.g. "/student/dashboard"),
   * read server-side once in src/app/(marketing)/layout.tsx via `auth()`
   * and passed down - deliberately not a client `useSession()` call, which
   * would need the app wrapped in a `<SessionProvider>` this project
   * doesn't otherwise need. `undefined` (the default) renders the
   * signed-out "Log in" / "Explore programs" pair unchanged.
   */
  dashboardHref?: string;
}

/**
 * Sticky nav, transparent over hero content until the page scrolls past
 * ~24px, then a frosted-glass solid background - see design-system.md §16.
 */
function Navbar({ dashboardHref }: NavbarProps) {
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-colors duration-200 ease-out",
        scrolled
          ? "border-border bg-background/80 border-b backdrop-blur-md"
          : "border-b border-transparent"
      )}
    >
      <Container className="flex h-18 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-150 ease-out",
                  isActive
                    ? "text-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {dashboardHref ? (
            <Button variant="primary" size="default" asChild>
              <Link href={dashboardHref}>Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="default" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button variant="primary" size="default" asChild>
                <Link href="/training">Explore programs</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetTitle>Menu</SheetTitle>
            <nav className="flex flex-col gap-1" aria-label="Primary">
              {NAV_LINKS.map((link) => (
                <SheetClose asChild key={link.href}>
                  <Link
                    href={link.href}
                    className="text-foreground hover:bg-accent rounded-md px-3 py-2.5 text-base font-medium"
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2">
              {dashboardHref ? (
                <Button variant="primary" asChild>
                  <Link href={dashboardHref}>Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button variant="primary" asChild>
                    <Link href="/training">Explore programs</Link>
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </Container>
    </header>
  );
}

export { Navbar };
