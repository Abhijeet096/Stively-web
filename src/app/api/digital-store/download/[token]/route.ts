import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";

import { resolveDigitalDownloadAccess, resolvePrivateAssetPath } from "@/features/orders/server/digital-download";

/**
 * The only place a paid digital product's actual bytes ever leave this
 * server - re-validates everything itself (never trusts the download page
 * having already checked), then streams the file straight from the repo's
 * private/ directory. Deliberately NOT a redirect to a public storage URL:
 * the file has no public URL anywhere, so the only way to fetch it is
 * through this route with a real, unexpired, PAID order's token.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const result = await resolveDigitalDownloadAccess(token);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason === "expired" ? "This download link has expired." : "This download link isn't valid." },
      { status: result.reason === "expired" ? 410 : 404 }
    );
  }

  const filePath = resolvePrivateAssetPath(result.access.assetPath);
  if (!filePath) return NextResponse.json({ error: "This download link isn't valid." }, { status: 404 });

  let file: Buffer;
  try {
    file = await readFile(filePath);
  } catch (error) {
    console.error("digital-store download: file read failed:", error);
    return NextResponse.json({ error: "Something went wrong preparing your download. Please contact support." }, { status: 500 });
  }

  const fileName = `${result.access.productTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;

  return new NextResponse(new Uint8Array(file), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": String(file.byteLength),
      // Never cached by a shared cache - each request re-verifies the order
      // is still PAID and the token hasn't expired, so a stale cached copy
      // must never be served in place of that check.
      "Cache-Control": "private, no-store",
    },
  });
}
