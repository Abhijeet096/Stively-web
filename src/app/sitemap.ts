import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getAllProgramSlugsWithDates } from "@/lib/queries/programs";
import {
  getAllOfferingSlugsWithDates,
  getAllUsedCategorySlugs,
  getCategoryLastModifiedMap,
} from "@/features/offerings/server/queries";
import { categoryToSlug } from "@/features/offerings/lib/category-slug";

// Company-site-only: blog.stively.com is a separate deployment with its own
// sitemap.ts (see blog-project/src/app/sitemap.ts) - never merge blog URLs
// in here. Re-fetched at most once an hour so newly published
// offerings/programs appear without a full redeploy (sitemap.ts is a cached
// route handler by default - see Next.js's sitemap file convention docs).
export const revalidate = 3600;

const STATIC_ROUTES: { path: string; priority: number }[] = [
  { path: "", priority: 1 },
  { path: "/about", priority: 0.8 },
  { path: "/services", priority: 0.8 },
  { path: "/pricing", priority: 0.8 },
  { path: "/training", priority: 0.8 },
  { path: "/offerings", priority: 0.8 },
  { path: "/work", priority: 0.7 },
  { path: "/contact", priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ path, priority }) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority,
  }));

  const programs = await getAllProgramSlugsWithDates();
  const programEntries: MetadataRoute.Sitemap = programs.map(({ slug, updatedAt }) => ({
    url: `${siteConfig.url}/training/${slug}`,
    lastModified: updatedAt,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  // Category archive URLs only for categories with at least one published
  // offering - an empty category would otherwise submit a thin, contentless
  // URL to Google.
  const [usedCategories, categoryLastModified] = await Promise.all([
    getAllUsedCategorySlugs(),
    getCategoryLastModifiedMap(),
  ]);
  const categoryEntries: MetadataRoute.Sitemap = usedCategories.map((category) => ({
    url: `${siteConfig.url}/offerings/${categoryToSlug(category)}`,
    lastModified: categoryLastModified[category] ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const offerings = await getAllOfferingSlugsWithDates();
  const offeringEntries: MetadataRoute.Sitemap = offerings.map(({ slug, updatedAt }) => ({
    url: `${siteConfig.url}/offerings/${slug}`,
    lastModified: updatedAt,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticEntries, ...programEntries, ...categoryEntries, ...offeringEntries];
}
