import "server-only";

import path from "node:path";

import { prisma } from "@/lib/prisma";
import type { Order } from "@prisma/client";

/**
 * The one real Offering that owns the "100 Practical AI Prompts" file -
 * looked up by slug (not hardcoded elsewhere) so both the standalone
 * Digital Store purchase and the GenAI course's promptsPack add-on resolve
 * to the exact same asset, never two copies of the same product.
 */
export const PROMPTS_PACK_PRODUCT_SLUG = "100-practical-ai-prompts";

export interface DigitalDownloadAccess {
  order: Order;
  productTitle: string;
  /** Relative to the repo's private/ directory - never public/. */
  assetPath: string;
  expiresAt: Date;
}

export type DigitalDownloadResult =
  | { ok: true; access: DigitalDownloadAccess }
  | { ok: false; reason: "not_found" | "not_paid" | "expired" };

/**
 * The single trust boundary for every real file download in this codebase -
 * both the download page (src/app/(marketing)/digital-store/download/
 * [token]/page.tsx, for a friendly pre-download screen) and the byte-serving
 * route (src/app/api/digital-store/download/[token]/route.ts) call this
 * independently and re-check everything themselves; neither trusts the
 * other having already validated it.
 *
 * Covers two real cases sharing one Order.downloadToken field:
 * 1. A DIGITAL_PRODUCT order's own purchase.
 * 2. A GenAI course order that added the promptsPack bonus at checkout -
 *    resolves to the SAME ebook Offering's file rather than a duplicated
 *    copy, so there is exactly one place the deliverable's path is set.
 */
export async function resolveDigitalDownloadAccess(token: string): Promise<DigitalDownloadResult> {
  if (!token) return { ok: false, reason: "not_found" };

  const order = await prisma.order.findUnique({
    where: { downloadToken: token },
    include: { offering: { select: { category: true, digitalAssetPath: true, title: true } } },
  });
  if (!order) return { ok: false, reason: "not_found" };
  if (order.status !== "PAID") return { ok: false, reason: "not_paid" };
  if (!order.downloadTokenExpiresAt || order.downloadTokenExpiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  let assetPath: string | null = null;
  let productTitle = order.offering.title;

  if (order.offering.category === "DIGITAL_PRODUCT" && order.offering.digitalAssetPath) {
    assetPath = order.offering.digitalAssetPath;
  } else {
    const addons = order.addons as { promptsPack?: { purchased?: boolean } } | null;
    if (addons?.promptsPack?.purchased) {
      const ebook = await prisma.offering.findUnique({
        where: { slug: PROMPTS_PACK_PRODUCT_SLUG },
        select: { title: true, digitalAssetPath: true },
      });
      assetPath = ebook?.digitalAssetPath ?? null;
      productTitle = ebook?.title ?? "Your bonus eBook";
    }
  }

  if (!assetPath) return { ok: false, reason: "not_found" };

  return { ok: true, access: { order, productTitle, assetPath, expiresAt: order.downloadTokenExpiresAt } };
}

/** Resolves a validated access's assetPath to an absolute filesystem path - rejects anything that isn't a plain, contained relative path, even though `assetPath` only ever comes from our own DB, never user input. */
export function resolvePrivateAssetPath(assetPath: string): string | null {
  if (assetPath.includes("..") || path.isAbsolute(assetPath)) return null;
  return path.join(process.cwd(), "private", assetPath);
}
