import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * Static routes only for now - no pages exist yet. As pages ship (Step 2+)
 * and dynamic routes like /training/[slug] go live, extend this by fetching
 * published slugs from Prisma and mapping them into the returned array.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/about", "/services", "/training", "/pricing", "/careers", "/contact"];

  return routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
