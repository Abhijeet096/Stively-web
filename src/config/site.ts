export const siteConfig = {
  name: "Stively",
  title: "Stively - Real Industry Experience for Students",
  description:
    "Stively helps students gain real industry experience through practical training programs, projects, and internships - while helping businesses build high-quality digital products.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://stively.com",
  ogImage: "/og-image.png",
  links: {
    twitter: "https://twitter.com/stively",
    linkedin: "https://linkedin.com/company/stively",
    instagram: "https://instagram.com/stively",
  },
  contactEmail: "hello@stively.com",
  // Optional - undefined until the business provides real values. The Contact
  // page renders each of these conditionally rather than showing a fabricated
  // placeholder (see docs/phase-e-visual-ux-planning.md's "no fabricated
  // content" discipline, applied here to contact info, not just testimonials).
  contactPhone: undefined as string | undefined,
  businessHours: undefined as string | undefined,
  officeLocation: "Remote-first — India" as string | undefined,
} as const;

export type SiteConfig = typeof siteConfig;
