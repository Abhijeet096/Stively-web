import "server-only";

import type { Lead } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { siteConfig } from "@/config/site";
import { createNotifications } from "@/features/notifications/server/creation";

/**
 * Fired once, from submitLead (src/actions/leads.ts), right after a Lead is
 * created - covers every adapter (Contact, Start Project, Client Portal
 * consultation, any future Careers form) with a single hook, per this
 * feature's plan. Both halves are independently non-fatal - a Resend outage
 * must never make lead submission fail for the visitor.
 */
export async function notifyNewLeadCreated(lead: Lead): Promise<void> {
  if (lead.email) {
    try {
      const { subject, html } = buildAcknowledgementEmail(lead);
      await resend.emails.send({ from: EMAIL_FROM, to: lead.email, subject, html });
    } catch (error) {
      console.error("notifyNewLeadCreated: acknowledgement email failed:", error);
    }
  }

  try {
    const salesUsers = await prisma.user.findMany({
      where: { role: "SALES" },
      select: { id: true, email: true },
    });
    if (salesUsers.length === 0) return;

    await createNotifications(
      salesUsers.map((u) => ({
        userId: u.id,
        type: "LEAD_NEW_INBOUND" as const,
        title: "New lead available",
        body: `${lead.name} - ${SOURCE_LABEL[lead.source] ?? lead.source}. First to claim it owns it.`,
        link: "/sales/inbound",
      }))
    );

    for (const u of salesUsers) {
      if (!u.email) continue;
      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: u.email,
          subject: `New lead: ${lead.name}`,
          html: `<p>A new lead just came in - <strong>${lead.name}</strong> (${SOURCE_LABEL[lead.source] ?? lead.source}). First to claim it owns it.</p><p><a href="${siteConfig.url}/sales/inbound">Claim it now</a></p>`,
        });
      } catch (error) {
        console.error("notifyNewLeadCreated: sales-team email failed for", u.email, error);
      }
    }
  } catch (error) {
    console.error("notifyNewLeadCreated: sales-team notify failed:", error);
  }
}

/** Fired from claimLead once a Role.SALES rep successfully claims a Lead - in-app only, for admin oversight, no email (per the founder's confirmed decision). */
export async function notifyLeadClaimed(lead: Lead, claimedByTeamMemberId: string): Promise<void> {
  const [admins, claimant] = await Promise.all([
    prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } }, select: { id: true } }),
    prisma.teamMember.findUnique({ where: { id: claimedByTeamMemberId }, select: { name: true } }),
  ]);
  if (admins.length === 0) return;

  await createNotifications(
    admins.map((admin) => ({
      userId: admin.id,
      type: "LEAD_CLAIMED" as const,
      title: "Lead claimed",
      body: `${claimant?.name ?? "A sales rep"} claimed ${lead.name}.`,
      link: `/admin/leads/${lead.id}`,
    }))
  );
}

const SOURCE_LABEL: Record<string, string> = {
  CONTACT_FORM: "Contact Form",
  PROGRAM_INTEREST: "Program Interest",
  CAREERS: "Careers",
  NEWSLETTER_POPUP: "Newsletter",
  CLIENT_PORTAL: "Client Portal",
  START_PROJECT: "Start Project (Ads)",
  OTHER: "Other",
};

function buildAcknowledgementEmail(lead: Lead): { subject: string; html: string } {
  const greeting = lead.name ? `Hi ${lead.name},` : "Hi there,";

  if (lead.source === "START_PROJECT") {
    return {
      subject: "Got it - we'll call you today",
      html: `<p>${greeting}</p><p>Thanks for reaching out to Stively - we've got your details and a real person from our team will call you back today.</p><p>If it's urgent, you can message us on WhatsApp any time.</p>`,
    };
  }

  return {
    subject: "We've received your message",
    html: `<p>${greeting}</p><p>Thanks for reaching out to Stively - we've received your message and our team will be in touch shortly.</p>`,
  };
}
