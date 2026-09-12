import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderCertificatePdf } from "@/features/certificates/server/render";

/**
 * The only place a certificate's PDF bytes ever get produced for a
 * download/view - rendered fresh from the Certificate row every request,
 * never read from a stored file (see render.ts's own comment on why).
 * Re-checks ownership on every call: a certificate is private until you
 * are either the student it was issued to or an admin - the public
 * verification page (/verify/[certificateId]) is the only anonymous-safe
 * surface, and it never serves these bytes, only a status summary.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ certificateNumber: string }> }) {
  const { certificateNumber } = await params;
  const forceDownload = _request.nextUrl.searchParams.get("mode") === "download";

  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=/api/certificates/${certificateNumber}/pdf`, _request.url));
  }

  const certificate = await prisma.certificate.findUnique({
    where: { certificateNumber },
    include: { enrollment: { select: { studentId: true } } },
  });
  if (!certificate) {
    return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
  }

  const isOwner = certificate.enrollment.studentId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "You don't have access to this certificate." }, { status: 403 });
  }

  if (certificate.status === "REVOKED") {
    return NextResponse.json({ error: "This certificate has been revoked and is no longer available for download." }, { status: 410 });
  }

  let file: Buffer;
  try {
    file = await renderCertificatePdf(certificate);
  } catch (error) {
    console.error("certificate pdf route: render failed:", error);
    return NextResponse.json({ error: "Something went wrong preparing your certificate. Please contact support." }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(file), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${forceDownload ? "attachment" : "inline"}; filename="${certificate.certificateNumber}.pdf"`,
      "Content-Length": String(file.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
