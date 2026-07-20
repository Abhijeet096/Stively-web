import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

export const alt = siteConfig.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Uses the real logo (public/logo.png), not a generated substitute -
 * public/logo-mark.png is a tightly-cropped, pre-optimized version of the
 * same file (the source is a 2000x2000 canvas with the wordmark occupying
 * a small fraction of it; cropping it here once, ahead of time, keeps the
 * wordmark legible at social-preview size instead of shrinking the whole
 * canvas down). Background (#2a353f) and the teal accent are sampled
 * directly from the source file so this blends into the real logo with no
 * visible seam, not approximated.
 */
export default async function OGImage() {
  const logoData = await readFile(join(process.cwd(), "public/logo-mark.png"));
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#2a353f",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse (Satori) requires a plain <img>, not next/image */}
        <img src={logoSrc} width={520} height={173} alt={siteConfig.name} />
        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontSize: 30,
            lineHeight: 1.4,
            color: "#a1a1aa",
            maxWidth: 920,
          }}
        >
          Real industry experience for students. Software delivery for businesses.
        </div>
      </div>
    ),
    { ...size }
  );
}
