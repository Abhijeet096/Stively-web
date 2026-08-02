import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Deliberately NOT the source PNG's real intrinsic size (900x263) - every
 * usage renders this at a fixed `h-6` (24px), so these are that actual
 * render size (same 900:263 aspect ratio) instead. Per next/image's own
 * docs: without a `sizes` prop, it generates a 1x/2x srcset sized off
 * whatever width/height you pass, on the assumption that's the real
 * display size - passing the full 900px source size here was making it
 * fetch ~1080px/1920px variants for an 82px-wide image on every single
 * page (Navbar/Footer/every auth & checkout layout all render <Logo>).
 */
const LOGO_WIDTH = 82;
const LOGO_HEIGHT = 24;

export interface LogoProps {
  className?: string;
  /**
   * "auto" (default) shows the navy-on-transparent mark in light mode and
   * the white-on-transparent mark in dark mode via `dark:` classes - no JS,
   * no hydration flicker, matches next-themes' class-based dark mode.
   * Force "dark" for surfaces that are always dark regardless of site theme
   * (e.g. Footer's `bg-ink`), or "light" for surfaces that are always light.
   */
  variant?: "auto" | "light" | "dark";
}

/**
 * Real logo asset (public/brand/logo-*-surface.png), trimmed and derived
 * from the brand kit (D:\Stively\Stively Brand kit) - light-surface is a
 * navy recolor of the same transparent wordmark, not a separate design.
 */
function Logo({ className, variant = "auto" }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center transition-opacity hover:opacity-80", className)}
    >
      {(variant === "auto" || variant === "light") && (
        <Image
          src="/brand/logo-light-surface.png"
          alt="Stively"
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          priority
          className={cn("h-6 w-auto", variant === "auto" && "dark:hidden")}
        />
      )}
      {(variant === "auto" || variant === "dark") && (
        <Image
          src="/brand/logo-dark-surface.png"
          alt="Stively"
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          priority
          className={cn("h-6 w-auto", variant === "auto" && "hidden dark:block")}
        />
      )}
    </Link>
  );
}

export { Logo };
