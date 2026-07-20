import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Same monogram as icon.tsx, sized for iOS home-screen use (Apple's
 * recommended 180x180). iOS applies its own corner-rounding mask on top of
 * whatever's here, so this fills the full square rather than pre-rounding
 * corners the way icon.tsx does for browser tabs.
 */
export default function AppleIcon() {
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
        }}
      >
        <div style={{ display: "flex", color: "#ffffff", fontSize: 104, fontWeight: 700 }}>S</div>
        <div style={{ display: "flex", width: 52, height: 14, background: "#00c4cc" }} />
      </div>
    ),
    { ...size }
  );
}
