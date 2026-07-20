import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { Container } from "@/components/shared/container";

interface CheckoutLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

/** Same minimal-chrome shell as src/app/enroll/[slug]/layout.tsx and src/app/request-proposal/[slug]/layout.tsx - see that file's comment for why. */
export default async function CheckoutLayout({ children, params }: CheckoutLayoutProps) {
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
        <Container className="max-w-md py-10 md:py-14">{children}</Container>
      </main>
    </div>
  );
}
