import "server-only";

import type { DiscoveryForm, SalesLead } from "@prisma/client";

import { resend, EMAIL_FROM } from "@/lib/resend";
import { siteConfig } from "@/config/site";
import { notifyAllAdmins } from "@/features/notifications/server/creation";

/** Sent when admin clicks Send/Resend on a discovery form - same resend/EMAIL_FROM reuse as every other email in this codebase (see sales-crm/server/notify.ts). No-ops silently if the lead has no email on file - the form still exists, it just can't be emailed (admin can still copy the link). */
export async function sendDiscoveryFormEmail(form: DiscoveryForm, lead: SalesLead, projectName?: string): Promise<void> {
  if (!lead.email) return;

  const link = `${siteConfig.url}/discovery/${form.token}`;
  const greeting = lead.ownerName ? `Hi ${lead.ownerName},` : "Hi there,";

  await resend.emails.send({
    from: EMAIL_FROM,
    to: lead.email,
    subject: "Stively — Project Discovery & Requirements Form",
    html: `
      <p>${greeting}</p>
      <p>Before we put together your proposal, we'd like to understand your project in detail. Please take a few minutes to fill out our Discovery & Requirements Form${projectName ? ` for <strong>${projectName}</strong>` : ""}.</p>
      <p>There's no need to complete it all in one sitting - your answers are saved as you go.</p>
      <p><a href="${link}" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">Fill out the form</a></p>
      <p>If the button doesn't work, use this link: ${link}</p>
      <p>- Team Stively</p>
    `,
  });
}

/** Notifies every admin the discovery form was submitted - see notifyAllAdmins. */
export async function notifyDiscoveryFormSubmitted(lead: SalesLead): Promise<void> {
  await notifyAllAdmins({
    type: "SALES_LEAD_ASSIGNED",
    title: "Discovery form submitted",
    body: `${lead.businessName} submitted their discovery form.`,
    link: `/admin/sales-crm/leads/${lead.id}`,
  });
}
