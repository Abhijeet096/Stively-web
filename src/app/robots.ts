import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/ceo",
          "/student",
          "/mentor",
          "/client",
          "/company",
          "/intern",
          "/team",
          "/profile",
          "/settings",
          "/help",
          "/api",
          "/style-guide",
          "/enroll",
          "/request-proposal",
          "/checkout",
          "/interview",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
