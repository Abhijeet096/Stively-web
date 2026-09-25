import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessPolicyForEnrollment } from "@/features/enrollments/server/access-policy";
import { richTextContentSchema } from "@/features/learning/lib/block-types";
import { renderDocumentPdf } from "@/features/documents/server/render";
import { ReadingNotesTemplate } from "@/features/learning/templates/reading-notes-template";

/**
 * Serves a MARKDOWN/RICH_TEXT lesson block as a downloadable PDF - the
 * Prime Membership perk block-text.tsx's download button points at.
 * Re-checks ownership and canDownloadResources server-side on every
 * request (never trusts the button having been hidden client-side), same
 * pattern as the certificate PDF route.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string; blockId: string }> }
) {
  const { enrollmentId, blockId } = await params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=/api/learning/${enrollmentId}/blocks/${blockId}/pdf`, _request.url)
    );
  }

  const policy = await getAccessPolicyForEnrollment(enrollmentId, session.user.id);
  if (!policy) {
    return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
  }
  if (!policy.canDownloadResources) {
    return NextResponse.json(
      { error: policy.canAccessLearning ? "Downloading lecture material is a Prime Membership perk." : (policy.reason ?? "You don't have access to this.") },
      { status: 403 }
    );
  }

  const block = await prisma.lessonBlock.findUnique({
    where: { id: blockId },
    select: {
      type: true,
      content: true,
      lesson: { select: { title: true, module: { select: { learningExperience: { select: { offeringId: true, offering: { select: { title: true } } } } } } } },
    },
  });
  if (!block || (block.type !== "MARKDOWN" && block.type !== "RICH_TEXT")) {
    return NextResponse.json({ error: "Reading material not found." }, { status: 404 });
  }
  // The block has to actually belong to this enrollment's own offering -
  // enrollmentId alone doesn't imply that without this check, and
  // policy.canDownloadResources only proved the enrollment itself is real
  // and premium, not that blockId is one of its own lessons.
  if (block.lesson.module.learningExperience.offeringId !== policy.enrollment.offeringId) {
    return NextResponse.json({ error: "Reading material not found." }, { status: 404 });
  }

  const parsed = richTextContentSchema.safeParse(block.content);
  if (!parsed.success) {
    return NextResponse.json({ error: "This reading material isn't ready yet." }, { status: 404 });
  }

  const file = await renderDocumentPdf(
    ReadingNotesTemplate({
      courseName: block.lesson.module.learningExperience.offering.title,
      lessonTitle: block.lesson.title,
      markdown: parsed.data.text,
    })
  );

  return new NextResponse(new Uint8Array(file), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${block.lesson.title.replace(/[^\w\- ]+/g, "").trim() || "lesson-notes"}.pdf"`,
      "Content-Length": String(file.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
