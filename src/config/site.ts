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
} as const;

export type SiteConfig = typeof siteConfig;
