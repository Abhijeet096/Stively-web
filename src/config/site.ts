export const siteConfig = {
  name: "Stively",
  title: "Stively - Real Industry Experience for Students",
  // Kept under ~160 characters so Google and social previews don't truncate
  // it mid-sentence - same meaning as before, just tightened for length.
  description:
    "Stively gives students real industry experience through training, projects, and internships - and helps businesses build high-quality software.",
  // Trailing slash stripped defensively - every call site builds URLs as
  // `${siteConfig.url}${path}` (sitemap.ts, robots.ts, JSON-LD, OpenGraph),
  // so a trailing slash here (however it got into the env var) would
  // silently produce double-slash URLs like https://www.stively.com//about
  // everywhere at once, not just in one place.
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stively.com").replace(/\/+$/, ""),
  links: {
    linkedin: "https://www.linkedin.com/company/stively-technologies/",
    instagram: "https://www.instagram.com/stivelyTechnologies",
    // Not live yet - omitted (not a placeholder URL) until there's a real
    // profile, same "no fabricated content" discipline as contactPhone/
    // businessHours below. Footer and the Organization JSON-LD both treat
    // this as optional and skip it while unset.
    twitter: undefined as string | undefined,
  },
  contactEmail: "team@stively.com",
  // Optional - undefined until the business provides real values. The Contact
  // page renders each of these conditionally rather than showing a fabricated
  // placeholder (see docs/phase-e-visual-ux-planning.md's "no fabricated
  // content" discipline, applied here to contact info, not just testimonials).
  contactPhone: undefined as string | undefined,
  businessHours: undefined as string | undefined,
  officeLocation: "Remote-first — India" as string | undefined,
} as const;

export type SiteConfig = typeof siteConfig;
