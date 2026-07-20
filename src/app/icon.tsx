import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Generated, not a raster crop of public/logo.png - the real wordmark
 * ("Stively", ~3.4:1 aspect ratio) is illegible at favicon sizes, and a
 * vector-rendered monogram stays crisp at every size Next.js requests.
 * Colors are sampled directly from public/logo.png (navy #2a353f, teal
 * #00c4cc, white text), not approximated - see opengraph-image.tsx for
 * the real wordmark used where there's room to show it legibly.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#2a353f",
          borderRadius: 6,
        }}
      >
        <div style={{ display: "flex", color: "#ffffff", fontSize: 20, fontWeight: 700 }}>S</div>
        <div style={{ display: "flex", width: 10, height: 3, background: "#00c4cc" }} />
      </div>
    ),
    { ...size }
  );
}
