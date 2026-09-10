import "server-only";

import { randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { formatPrice } from "@/lib/utils";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { siteConfig } from "@/config/site";
import { createOperationItemForOrder } from "@/features/operations/server/creation";
import { createEnrollmentFromOrder } from "@/features/enrollments/server/creation";
import { notifyOrderPaid } from "./notify";
import { generateAutoLoginToken, computeAutoLoginExpiry } from "../lib/guest-checkout-token";

export interface GuestOrderFulfillmentResult {
  /** True only when THIS call performed the actual fulfillment (account creation, enrollment, email) - the other of the two callers (client-side verify vs. the payment webhook) that loses the race sees false and skips straight to returning whatever's already there. */
  claimed: boolean;
  userId: string;
  /** Null if this order's token has already been consumed (a real auto-login click happened before this call ran) - only meaningful when claimed is true or the token hasn't been used yet. */
  autoLoginLink: string | null;
}

const SUPPORT_EMAIL = "team@stively.com";
const UDYAM_REGISTRATION = "UDYAM-RJ-17-0578717";

/** Name and email come straight from what the buyer typed at checkout - escaped so a stray angle bracket (or a deliberate one) can't inject markup into an email we send on their behalf. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * The post-purchase welcome email for a guest-checkout order. Its whole job
 * is to leave a first-time buyer certain of three things: the payment
 * worked, the course is already open to them, and they can get back in
 * later. Deliberately says nothing about how the account was created beyond
 * "automatically during checkout" - no mention of the sign-in link's
 * mechanics, and never any suggestion that the account is provisional or
 * needs activating, which is the fastest way to make someone think they
 * have to pay again.
 *
 * Subject and body are built together because they're one message - a
 * caller that could set a mismatched subject is a bug waiting to happen.
 */
function buildWelcomeEmail(params: {
  firstName: string;
  courseName: string;
  amountLabel: string;
  email: string;
  autoLoginLink: string;
}): { subject: string; html: string } {
  const firstName = escapeHtml(params.firstName);
  const courseName = escapeHtml(params.courseName);
  const email = escapeHtml(params.email);
  const amountLabel = escapeHtml(params.amountLabel);
  const loginUrl = `${siteConfig.url}/login`;

  const subject = `You're in - your ${params.courseName} is ready`;
  const preview = "Your Stively course is ready. Here's how to access your account and set your password.";

  const detailRow = (label: string, value: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eef0f4;">
        <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;">${label}</div>
        <div style="font-size:15px;color:#111827;font-weight:600;margin-top:2px;">${value}</div>
      </td>
    </tr>`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f5f6f8;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preview}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;border:1px solid #e6e8ee;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

          <tr>
            <td style="padding:24px 28px 0;">
              <div style="font-size:20px;font-weight:700;color:#0f172a;letter-spacing:-.02em;">Stively</div>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 28px 0;">
              <p style="margin:0 0 14px;font-size:16px;color:#111827;line-height:1.6;">Hi ${firstName},</p>
              <p style="margin:0 0 14px;font-size:16px;color:#111827;line-height:1.6;font-weight:600;">Welcome to Stively.</p>
              <p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.65;">
                Your payment for the ${courseName} was successful, and your course access is now active.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:12px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafbfc;border:1px solid #eef0f4;border-radius:10px;padding:4px 16px;">
                ${detailRow("Course", courseName)}
                ${detailRow("Amount paid", amountLabel)}
                <tr>
                  <td style="padding:10px 0;">
                    <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;">Email linked to your Stively account</div>
                    <div style="font-size:15px;color:#111827;font-weight:600;margin-top:2px;word-break:break-all;">${email}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px 0;">
              <p style="margin:0;font-size:15px;color:#374151;line-height:1.65;">
                Your account was created automatically during checkout, so you did not need to create a password.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 28px 0;">
              <a href="${params.autoLoginLink}"
                 style="display:block;background:#4f46e5;color:#ffffff;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:16px;text-align:center;">
                Start Learning &rarr;
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:26px 28px 0;">
              <div style="height:1px;background:#eef0f4;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 28px 0;">
              <p style="margin:0 0 10px;font-size:16px;font-weight:600;color:#0f172a;">Want to set a password?</p>
              <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.65;">
                You can create your own password at any time using Forgot Password on the Stively sign-in page.
              </p>
              <ol style="margin:0 0 12px;padding-left:20px;font-size:15px;color:#374151;line-height:1.9;">
                <li>Open <a href="${loginUrl}" style="color:#4f46e5;">Stively Sign In</a></li>
                <li>Enter ${email}</li>
                <li>Select Forgot Password</li>
                <li>Follow the password-reset instructions sent to your email</li>
              </ol>
              <p style="margin:0;font-size:15px;color:#374151;line-height:1.65;">
                After setting your password, you can sign in normally from any device.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 28px 0;">
              <p style="margin:0 0 10px;font-size:16px;font-weight:600;color:#0f172a;">Your Stively account contains:</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:15px;color:#374151;line-height:1.8;">
                <tr><td style="padding-right:8px;color:#16a34a;">&#10003;</td><td>Your course access</td></tr>
                <tr><td style="padding-right:8px;color:#16a34a;">&#10003;</td><td>Your learning progress</td></tr>
                <tr><td style="padding-right:8px;color:#16a34a;">&#10003;</td><td>Your quiz results</td></tr>
                <tr><td style="padding-right:8px;color:#16a34a;">&#10003;</td><td>Your certificate when completed</td></tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafbfc;border:1px solid #eef0f4;border-radius:10px;">
                <tr>
                  <td style="padding:14px 16px;font-size:14px;color:#374151;line-height:1.6;">
                    <strong style="color:#0f172a;">Important:</strong> Keep this email for your records. Your course access is linked to ${email}.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 28px 0;">
              <p style="margin:0;font-size:15px;color:#374151;line-height:1.65;">
                <strong style="color:#0f172a;">Need help?</strong><br>
                Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color:#4f46e5;">${SUPPORT_EMAIL}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 28px 28px;">
              <div style="height:1px;background:#eef0f4;margin-bottom:16px;"></div>
              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">
                Regards,<br>
                <strong style="color:#0f172a;">Stively Technologies</strong><br>
                <a href="${siteConfig.url}" style="color:#4f46e5;text-decoration:none;">stively.com</a><br>
                Udyam Registered: ${UDYAM_REGISTRATION}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

/**
 * The one place a guest-checkout order (Offering.allowsGuestCheckout)
 * actually becomes a real, enrolled, logged-in-capable account. Called
 * from both submitGuestPayment (guest-checkout-actions.ts, the client's
 * own immediate post-payment call) and the Razorpay webhook's PAID branch
 * (/api/webhooks/payment) - same defense-in-depth duplication the
 * authenticated checkout flow already has (see that route's own comment on
 * why), extended to cover "the account doesn't exist yet either." Safe to
 * call twice: the atomic `updateMany` below is the real race guard - only
 * whichever caller flips PENDING->PAID first does the account-creation/
 * enrollment/email side effects, the other just reports the outcome.
 */
export async function fulfillGuestOrder(orderId: string): Promise<GuestOrderFulfillmentResult | null> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { offering: { select: { title: true } } } });
  if (!order) return null;

  const claim = await prisma.order.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: { status: "PAID", paidAt: new Date() },
  });
  const claimed = claim.count > 0;

  if (!claimed) {
    // Lost the race (or this order was never PENDING to begin with, e.g.
    // called twice for the same already-fulfilled order) - report the
    // current state rather than redoing any work.
    const current = await prisma.order.findUnique({ where: { id: orderId } });
    if (!current?.userId) return null;
    return {
      claimed: false,
      userId: current.userId,
      autoLoginLink: current.autoLoginToken ? `${siteConfig.url}/orders/auto-login?token=${current.autoLoginToken}` : null,
    };
  }

  let userId = order.userId;
  if (!userId) {
    if (!order.guestEmail) throw new Error(`fulfillGuestOrder: order ${orderId} has no userId and no guestEmail - can't create an account`);

    const existing = await prisma.user.findUnique({ where: { email: order.guestEmail } });
    if (existing) {
      userId = existing.id;
    } else {
      // A real, never-shown random password - this account is fully
      // functional via the normal Credentials sign-in the moment the buyer
      // sets a real password via "Forgot password" (or later in Settings),
      // exactly like any other account. Nobody, including this server
      // process after this call returns, ever has this plaintext value.
      const randomPassword = randomBytes(32).toString("base64url");
      const created = await prisma.user.create({
        data: {
          email: order.guestEmail,
          name: order.guestName,
          role: "STUDENT",
          password: await hashPassword(randomPassword),
          emailVerified: new Date(),
          passwordChangedAt: new Date(),
        },
      });
      userId = created.id;
    }

    await prisma.order.update({ where: { id: orderId }, data: { userId } });
  }

  const token = generateAutoLoginToken();
  const paidOrder = await prisma.order.update({
    where: { id: orderId },
    data: { userId, autoLoginToken: token, autoLoginTokenExpiresAt: computeAutoLoginExpiry() },
  });

  try {
    await createOperationItemForOrder(paidOrder);
  } catch (error) {
    console.error("fulfillGuestOrder: createOperationItemForOrder failed:", error);
  }
  try {
    await createEnrollmentFromOrder(paidOrder);
  } catch (error) {
    console.error("fulfillGuestOrder: createEnrollmentFromOrder failed:", error);
  }
  try {
    await notifyOrderPaid(paidOrder);
  } catch (error) {
    console.error("fulfillGuestOrder: notifyOrderPaid failed:", error);
  }

  const autoLoginLink = `${siteConfig.url}/orders/auto-login?token=${token}`;
  try {
    const { subject, html } = buildWelcomeEmail({
      // First name only - "Hi Priya" reads like a person wrote it, "Hi Priya Sharma" doesn't.
      firstName: order.guestName?.trim().split(/\s+/)[0] || "there",
      courseName: order.offering.title,
      // The real charged total, so an order that included the prompts pack
      // shows what actually left the buyer's account rather than the
      // course's own price.
      amountLabel: formatPrice(order.amount, order.currency),
      email: order.guestEmail!,
      autoLoginLink,
    });
    await resend.emails.send({ from: EMAIL_FROM, to: order.guestEmail!, subject, html });
  } catch (error) {
    console.error("fulfillGuestOrder: welcome email failed:", error);
  }

  return { claimed: true, userId, autoLoginLink };
}
