import { Logo } from "@/components/shared/logo";

/**
 * Deliberately not the marketing (Navbar+Footer) chrome, and not the ink
 * dark hero treatment either - a sign-in/register page should feel calm
 * and get out of the way, not sell anything. Just the wordmark and a very
 * quiet brand wash, consistent with (not a copy of) the rest of the site's
 * signal-gradient language.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background relative flex min-h-screen flex-col">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px]"
        style={{
          background:
            "radial-gradient(ellipse 900px 420px at 50% -15%, oklch(0.541 0.216 265.75 / 0.12), transparent 60%)",
        }}
      />
      <div className="flex justify-center px-6 py-10">
        <Logo />
      </div>
      <main id="main-content" className="flex flex-1 items-start justify-center px-6 pb-20">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
