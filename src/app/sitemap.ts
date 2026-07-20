import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getAllProgramSlugs } from "@/lib/queries/programs";
import { getAllOfferingSlugs, getAllUsedCategorySlugs } from "@/features/offerings/server/queries";
import { categoryToSlug } from "@/features/offerings/lib/category-slug";

/**
 * Static routes + dynamic program routes. The dynamic portion was flagged
 * as a TODO here since Phase B ("extend this... as dynamic routes like
 * /training/[slug] go live") - Program Detail is now live, so this closes
 * that gap rather than leaving program pages out of the sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // "/pricing" and "/careers" are planned (see docs/phase-a-product-plan.md,
  // docs/phase-e-visual-ux-planning.md) but not built yet - listing an
  // unbuilt route here would submit a URL to Google that 404s, which
  // Search Console reports as a crawl error. Add back once those pages ship.
  const routes = ["", "/about", "/services", "/training", "/offerings", "/contact"];

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

  // Category archive URLs only for categories with at least one published
  // offering - an empty category would otherwise submit a thin, contentless
  // URL to Google (same discipline as the "/pricing"/"/careers" omission
  // above, just data-driven instead of a hardcoded not-built-yet list).
  const usedCategories = await getAllUsedCategorySlugs();
  const categoryEntries: MetadataRoute.Sitemap = usedCategories.map((category) => ({
    url: `${siteConfig.url}/offerings/${categoryToSlug(category)}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const offeringSlugs = await getAllOfferingSlugs();
  const offeringEntries: MetadataRoute.Sitemap = offeringSlugs.map((slug) => ({
    url: `${siteConfig.url}/offerings/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticEntries, ...programEntries, ...categoryEntries, ...offeringEntries];
}
