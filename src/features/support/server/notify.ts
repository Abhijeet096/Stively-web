import "server-only";

import type { StudentQuery, User } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { siteConfig } from "@/config/site";
import { notifyAllAdmins } from "@/features/notifications/server/creation";

/**
 * Fired once, from submitStudentQuery, right after a StudentQuery is
 * created - the student-support twin of notifyNewLeadCreated
 * (src/features/leads/server/notify.ts), same non-fatal-per-recipient
 * discipline, but to every admin (notifyAllAdmins) rather than the sales
 * team, since this was never a Lead to begin with.
 */
export async function notifyNewStudentQuery(query: StudentQuery, student: Pick<User, "name" | "email">): Promise<void> {
  const studentLabel = student.name ?? student.email ?? "A student";

  try {
    await notifyAllAdmins({
      type: "STUDENT_QUERY_SUBMITTED",
      title: "Student support query",
      body: `${studentLabel}: ${truncate(query.message, 140)}`,
      link: "/admin/student-support",
    });
  } catch (error) {
    console.error("notifyNewStudentQuery: in-app notification failed:", error);
  }

  let admins: { email: string | null }[] = [];
  try {
    admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { email: true },
    });
  } catch (error) {
    console.error("notifyNewStudentQuery: could not load admins:", error);
    return;
  }

  for (const admin of admins) {
    if (!admin.email) continue;
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: admin.email,
        subject: `Student support query from ${studentLabel}`,
        html: `<p>${studentLabel} (${student.email ?? "no email on file"}) sent a support query:</p><blockquote>${escapeHtml(query.message)}</blockquote><p><a href="${siteConfig.url}/admin/student-support">View in admin</a></p>`,
      });
    } catch (error) {
      console.error("notifyNewStudentQuery: email failed for", admin.email, error);
    }
  }
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
