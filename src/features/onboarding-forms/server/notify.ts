import "server-only";

import type { OnboardingForm, SalesProject } from "@prisma/client";

import { resend, EMAIL_FROM } from "@/lib/resend";
import { siteConfig } from "@/config/site";
import { notifyAllAdmins } from "@/features/notifications/server/creation";

/** Sent when admin clicks Send/Resend on an onboarding form - same resend/EMAIL_FROM reuse as every other email in this codebase. No-ops silently if there's no contact email on file - the form still exists, admin can still copy the link. */
export async function sendOnboardingFormEmail(form: OnboardingForm, project: Pick<SalesProject, "name">, toEmail: string | null | undefined): Promise<void> {
  if (!toEmail) return;
  const link = `${siteConfig.url}/onboarding/${form.token}`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: toEmail,
    subject: "Stively Technologies — Client Onboarding Form",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
        <p>Hi,</p>
        <p>Congratulations on approving your project with Stively! Before we begin work on <strong>${project.name}</strong>, we need a few details to kick things off properly - brand assets, technical access, content, and a few logistics.</p>
        <p>There's no need to complete it all in one sitting.</p>
        <p><a href="${link}" style="display:inline-block;padding:10px 20px;background:#ec3013;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Fill out the onboarding form</a></p>
        <p style="color:#6b7280;font-size:13px;">Please don't include passwords or API secrets in the form - we'll follow up with secure instructions for sharing those once it's submitted.</p>
        <p>If the button doesn't work, use this link: ${link}</p>
        <p>- Team Stively</p>
      </div>
    `,
  });
}

/** Notifies every admin the onboarding form was submitted - see notifyAllAdmins. */
export async function notifyOnboardingFormSubmitted(project: Pick<SalesProject, "id" | "name" | "clientName">): Promise<void> {
  await notifyAllAdmins({
    type: "SALES_LEAD_ASSIGNED",
    title: "Onboarding form submitted",
    body: `${project.clientName} submitted the onboarding form for ${project.name}.`,
    link: `/admin/sales-crm/projects/${project.id}`,
  });
}
