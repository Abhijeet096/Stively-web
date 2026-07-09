import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

/**
 * Wraps every page under app/(marketing) - Home now, About/Training/etc.
 * as they're built. Deliberately separate from (auth) and (dashboard),
 * which will get their own layouts later (no marketing nav on the
 * dashboard's app shell - see Phase D §6).
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
