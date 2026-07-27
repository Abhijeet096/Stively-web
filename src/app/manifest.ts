import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/**
 * Auto-detected by Next.js (no manual <link rel="manifest"> needed).
 * Colors sampled directly from the real brand kit (public/logo.png's navy
 * background) - not approximated. Static src/app/icon.png + apple-icon.png
 * are served at literal /icon.png + /apple-icon.png (unlike the old
 * code-generated icon.tsx, which resolved at the extension-less /icon).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.title,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#2e3a46",
    theme_color: "#2e3a46",
    icons: [
      { src: "/icon.png", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
