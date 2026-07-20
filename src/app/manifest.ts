import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/**
 * Auto-detected by Next.js (no manual <link rel="manifest"> needed).
 * Colors match the real logo (public/logo.png): navy background, and the
 * same teal used for its "i" as the manifest's theme_color, not the site's
 * CSS --primary token - see the note in icon.tsx.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.title,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#2a353f",
    theme_color: "#2a353f",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
