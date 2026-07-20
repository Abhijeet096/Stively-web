import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { Container } from "@/components/shared/container";

interface EnrollLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

/**
 * Deliberately minimal chrome - not nested under (marketing) (which would
 * force-inherit the full navbar/footer with no way to opt out inside the
 * App Router) and not the portal dashboard shell either. A focused,
 * Stripe-checkout-style shell: logo, a way out, nothing else competing for
 * attention during a multi-step application.
 */
export default async function EnrollLayout({ children, params }: EnrollLayoutProps) {
  const { slug } = await params;

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="border-border flex items-center justify-between border-b px-6 py-4">
        <Logo />
        <Link href={`/offerings/${slug}`} className="text-muted-foreground text-sm hover:text-foreground">
          Save &amp; exit
        </Link>
      </header>
      <main id="main-content" className="flex flex-1 justify-center">
        <Container className="max-w-2xl py-10 md:py-14">{children}</Container>
      </main>
    </div>
  );
}
