import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

import { siteConfig } from "@/config/site";
import { Analytics } from "@/components/analytics/analytics";
import { JsonLd } from "@/components/shared/json-ld";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face for h1/section h2 headings only (see docs/design-system.md's
// typography addendum) - every other role (body, buttons, card titles, nav)
// stays on Geist Sans above.
const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bricolageGrotesque.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="bg-background text-foreground sr-only rounded-md px-4 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus:outline-none"
        >
          Skip to main content
        </a>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: siteConfig.name,
            url: siteConfig.url,
            logo: `${siteConfig.url}/logo-mark.png`,
            description: siteConfig.description,
            // .filter(Boolean) drops twitter while it's unset, so an unset
            // profile never serializes as a `null` entry in the schema.
            sameAs: [
              siteConfig.links.linkedin,
              siteConfig.links.instagram,
              siteConfig.links.twitter,
            ].filter(Boolean),
          }}
        />
        {/*
          defaultTheme="light" + enableSystem={false} is deliberate, not an
          oversight: the marketing site's "ink" dark bookend sections
          (Hero/Process/CTA/Footer) are hand-tuned against a light base
          canvas, and flipping the whole site to dark for
          prefers-color-scheme:dark visitors was never visually verified.
          The toggle this enables is scoped to the dashboard shell's
          ThemeSwitch (src/components/dashboard-shell/theme/theme-switch.tsx)
          - light stays the default everywhere until a user explicitly
          opts in, and their choice persists via localStorage from then on.
        */}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} nonce={nonce}>
          {children}
        </ThemeProvider>
        <WhatsAppButton />
        <Analytics nonce={nonce} />
      </body>
    </html>
  );
}
