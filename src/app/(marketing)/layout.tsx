import { auth } from "@/lib/auth";
import { ROLE_HOME } from "@/config/rbac";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

/**
 * Wraps every page under app/(marketing) - Home now, About/Training/etc.
 * as they're built. Deliberately separate from (auth), (portal), and
 * (dashboard), which have their own layouts (no marketing nav on any
 * authenticated app shell - see Phase D §6).
 *
 * Reads the session once, server-side, so Navbar can swap "Log in" for a
 * "Dashboard" link when a visitor is already signed in - a server `auth()`
 * call here instead of a client `useSession()` in Navbar itself, since
 * this project doesn't wrap the app in a `<SessionProvider>`.
 */
export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const dashboardHref = session?.user ? ROLE_HOME[session.user.role] : undefined;

  return (
    <>
      <Navbar dashboardHref={dashboardHref} />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}
