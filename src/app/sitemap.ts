import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getAllProgramSlugs } from "@/lib/queries/programs";

/**
 * Static routes + dynamic program routes. The dynamic portion was flagged
 * as a TODO here since Phase B ("extend this... as dynamic routes like
 * /training/[slug] go live") - Program Detail is now live, so this closes
 * that gap rather than leaving program pages out of the sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = ["", "/about", "/services", "/training", "/pricing", "/careers", "/contact"];

  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8,
  }));

  const programSlugs = await getAllProgramSlugs();
  const programEntries: MetadataRoute.Sitemap = programSlugs.map((slug) => ({
    url: `${siteConfig.url}/training/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticEntries, ...programEntries];
}
