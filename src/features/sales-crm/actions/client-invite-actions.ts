"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { createPasswordResetToken } from "@/lib/auth-tokens";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { siteConfig } from "@/config/site";
import type { ActionResult } from "@/actions/leads";
import { inviteClientToPortalSchema } from "../validation/client-invite-schemas";
import { resolveSalesCrmViewer } from "../server/rbac";

async function actorTeamMemberId(userId: string): Promise<string | undefined> {
  const teamMember = await prisma.teamMember.findUnique({ where: { userId } });
  return teamMember?.id;
}

function buildWelcomeEmailHtml(businessName: string, setupUrl: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
      <p>Hi,</p>
      <p>Stively has set up a client workspace account for <strong>${businessName}</strong> - your proposal, contract, invoices, payments, and project progress will all live there from now on, in one place.</p>
      <p><a href="${setupUrl}" style="display:inline-block;background:#2e3a46;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Set up your account</a></p>
      <p style="color:#6b7280;font-size:13px;">This link expires in 1 hour. If it expires, use "Forgot password" on the sign-in page with this same email address.</p>
    </div>
  `;
}

function buildAlreadyLinkedEmailHtml(businessName: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
      <p>Hi,</p>
      <p>Your existing Stively account has been linked to a new business workspace for <strong>${businessName}</strong>. Sign in as usual to see everything.</p>
      <p><a href="${siteConfig.url}/login" style="display:inline-block;background:#2e3a46;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Sign in</a></p>
    </div>
  `;
}

export type InviteClientToPortalResult = ActionResult & { alreadyHadAccount?: boolean };

/**
 * Provisions (or links an existing) CLIENT-role account for a SalesLead's
 * business contact, per "the salesperson gets the client to create a real
 * Stively account" - never automatic, always a deliberate admin/sales click
 * from the lead detail page. Mirrors hireAsSalesPerson's provisioning shape
 * (src/features/sales-crm/actions/hire-actions.ts) but reuses the existing
 * password-reset token/page (src/actions/auth.ts's resetPassword,
 * /reset-password) for account activation instead of a temp password shown
 * once - a client setting their own password by email link is the right
 * flow here, not a password read aloud over a phone call.
 */
export async function inviteClientToPortal(input: unknown): Promise<InviteClientToPortalResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = inviteClientToPortalSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    const lead = await prisma.salesLead.findUnique({ where: { id: data.salesLeadId } });
    if (!lead) return { success: false, error: "Lead not found." };
    if (!viewer.hasFullAccess && lead.assignedToId !== viewer.teamMemberId) {
      return { success: false, error: "Lead not found." };
    }

    if (lead.clientUserId) return { success: false, error: "This business already has a linked client account." };
    if (!lead.email) return { success: false, error: "This lead has no email on file - add one before inviting a client account." };

    const actorId = await actorTeamMemberId(user.id);
    const existingUser = await prisma.user.findUnique({ where: { email: lead.email } });

    if (existingUser && existingUser.role !== "CLIENT") {
      return {
        success: false,
        error: `An account with this email already exists as a ${existingUser.role.toLowerCase()} account - it can't be reused as a client account.`,
      };
    }

    let clientUserId: string;
    let alreadyHadAccount: boolean;

    if (existingUser) {
      clientUserId = existingUser.id;
      alreadyHadAccount = true;
      await resend.emails
        .send({
          from: EMAIL_FROM,
          to: existingUser.email!,
          subject: `${lead.businessName} is now on your Stively account`,
          html: buildAlreadyLinkedEmailHtml(lead.businessName),
        })
        .catch((error) => console.error("inviteClientToPortal (existing user) email failed:", error));
    } else {
      const created = await prisma.user.create({
        data: {
          name: lead.ownerName,
          email: lead.email,
          companyName: lead.businessName,
          role: "CLIENT",
          emailVerified: new Date(),
        },
      });
      clientUserId = created.id;
      alreadyHadAccount = false;

      const token = await createPasswordResetToken(created.id);
      const setupUrl = `${siteConfig.url}/reset-password?token=${token}`;
      await resend.emails
        .send({
          from: EMAIL_FROM,
          to: created.email!,
          subject: "Welcome to Stively - set up your account",
          html: buildWelcomeEmailHtml(lead.businessName, setupUrl),
        })
        .catch((error) => console.error("inviteClientToPortal (new user) email failed:", error));
    }

    await prisma.$transaction(async (tx) => {
      await tx.salesLead.update({ where: { id: lead.id }, data: { clientUserId } });
      await tx.salesLeadActivity.create({
        data: { salesLeadId: lead.id, type: "CLIENT_ACCOUNT_INVITED", performedById: actorId ?? null },
      });
    });

    revalidatePath(`/admin/sales-crm/leads/${lead.id}`);
    revalidatePath(`/sales/leads/${lead.id}`);
    return { success: true, alreadyHadAccount };
  } catch (error) {
    console.error("inviteClientToPortal failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
