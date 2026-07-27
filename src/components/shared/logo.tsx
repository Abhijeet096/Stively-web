import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** Real intrinsic size of both public/brand/logo-*-surface.png exports - keeps next/image from guessing an aspect ratio. */
const LOGO_WIDTH = 900;
const LOGO_HEIGHT = 263;

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
