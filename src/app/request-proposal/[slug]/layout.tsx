import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { Container } from "@/components/shared/container";

interface RequestProposalLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

/** Business twin of src/app/enroll/[slug]/layout.tsx - see that file's comment for why this is a fresh, minimal-chrome shell rather than nested under (marketing) or the portal dashboard. */
export default async function RequestProposalLayout({ children, params }: RequestProposalLayoutProps) {
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
