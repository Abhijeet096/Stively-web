import "server-only";

import { randomBytes } from "crypto";

import type { Order, OfferingCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { formatPrice } from "@/lib/utils";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { siteConfig } from "@/config/site";
import { handleOrderPaid } from "./post-purchase";
import {
  generateAutoLoginToken,
  computeAutoLoginExpiry,
  generateDownloadToken,
  computeDownloadTokenExpiry,
} from "../lib/guest-checkout-token";

export interface GuestOrderFulfillmentResult {
  /** True only when THIS call performed the actual fulfillment (account creation, enrollment, email) - the other of the two callers (client-side verify vs. the payment webhook) that loses the race sees false and skips straight to returning whatever's already there. */
  claimed: boolean;
  userId: string;
  /** Null if this order's token has already been consumed (a real auto-login click happened before this call ran) - only meaningful when claimed is true or the token hasn't been used yet. */
  autoLoginLink: string | null;
  /** Set only for a DIGITAL_PRODUCT order - where the primary post-payment redirect should go instead of autoLoginLink (there's no LMS to auto-login into). Null for every other order. */
  downloadUrl: string | null;
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
  /** Set only when this order also purchased the promptsPack checkout add-on - renders a second download CTA for the real eBook file, rather than the old unfulfilled "bonus" promise. */
  bonusDownloadUrl?: string | null;
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

          ${
            params.bonusDownloadUrl
              ? `<tr>
            <td style="padding:22px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0 0 10px;font-size:15px;font-weight:600;color:#0f172a;">Your bonus eBook is ready too</p>
                    <a href="${params.bonusDownloadUrl}" style="color:#4f46e5;font-size:14px;font-weight:600;text-decoration:none;">Download 100 Practical AI Prompts &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
              : ""
          }

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
 * The post-purchase email for a DIGITAL_PRODUCT order (no LMS, no
 * enrollment, no "course access" language) - the payment confirmation
 * IS the delivery mechanism, so the one thing this email needs to do well
 * is put a working download link in front of the buyer immediately, with a
 * fallback they can return to any time before it expires.
 */
function buildDigitalDownloadEmail(params: {
  firstName: string;
  productName: string;
  amountLabel: string;
  downloadUrl: string;
  expiresAt: Date;
}): { subject: string; html: string } {
  const firstName = escapeHtml(params.firstName);
  const productName = escapeHtml(params.productName);
  const amountLabel = escapeHtml(params.amountLabel);
  const expiresLabel = params.expiresAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const subject = `Your ${params.productName} is ready to download`;
  const preview = "Your Stively purchase is ready. Here's your download link.";

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
              <p style="margin:0 0 14px;font-size:16px;color:#111827;line-height:1.6;font-weight:600;">Your download is ready.</p>
              <p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.65;">
                Your payment for <strong>${productName}</strong> was successful. Click below to get your file.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 28px 0;">
              <a href="${params.downloadUrl}"
                 style="display:block;background:#4f46e5;color:#ffffff;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:16px;text-align:center;">
                Download ${productName} &rarr;
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:12px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafbfc;border:1px solid #eef0f4;border-radius:10px;padding:4px 16px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #eef0f4;">
                    <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;">Amount paid</div>
                    <div style="font-size:15px;color:#111827;font-weight:600;margin-top:2px;">${amountLabel}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;">Link valid until</div>
                    <div style="font-size:15px;color:#111827;font-weight:600;margin-top:2px;">${expiresLabel}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 28px 0;">
              <p style="margin:0;font-size:15px;color:#374151;line-height:1.65;">
                You can come back and download this file as many times as you like before the date above. Keep this
                email for your records.
              </p>
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
 * Idempotent and race-safe: generates and persists a download token only if
 * this order both needs one (a DIGITAL_PRODUCT order, or a course order
 * with the promptsPack add-on) and doesn't already have one. Callable any
 * number of times, from any number of concurrent fulfillment attempts, for
 * the same order - the conditional `updateMany` (only writes while
 * `downloadToken` is still null) means at most one caller ever actually
 * generates a token; every other caller just reads back whichever one won.
 *
 * Exists specifically so a PAID order can never get stuck without its file:
 * the original version of this generation step lived inline in the
 * "won the race" branch below with no equivalent in the "lost the race"
 * branch, so a caller that lost the race - or one whose earlier attempt
 * threw partway through, e.g. a transient DB error, after already claiming
 * PENDING->PAID - would see `claimed: false` (or a resumed later call) and
 * just read back `downloadToken: null` forever, with no path to ever fix
 * it. Called from both branches now, so re-entry always has a chance to
 * finish what an earlier, incomplete attempt started.
 */
async function ensureDownloadUnlocked(
  order: Order & { offering: { category: OfferingCategory } }
): Promise<{ downloadUrl: string | null; downloadTokenExpiresAt: Date | null; freshlyGenerated: boolean }> {
  const isDigitalProduct = order.offering.category === "DIGITAL_PRODUCT";
  const addons = order.addons as { promptsPack?: { purchased?: boolean } } | null;
  const needsDownload = isDigitalProduct || addons?.promptsPack?.purchased === true;
  if (!needsDownload) return { downloadUrl: null, downloadTokenExpiresAt: null, freshlyGenerated: false };

  if (order.downloadToken && order.downloadTokenExpiresAt) {
    return {
      downloadUrl: `${siteConfig.url}/digital-store/download/${order.downloadToken}`,
      downloadTokenExpiresAt: order.downloadTokenExpiresAt,
      freshlyGenerated: false,
    };
  }

  const downloadToken = generateDownloadToken();
  const downloadTokenExpiresAt = computeDownloadTokenExpiry();
  try {
    const claim = await prisma.order.updateMany({
      where: { id: order.id, downloadToken: null },
      data: { downloadToken, downloadTokenExpiresAt },
    });
    if (claim.count > 0) {
      return { downloadUrl: `${siteConfig.url}/digital-store/download/${downloadToken}`, downloadTokenExpiresAt, freshlyGenerated: true };
    }
  } catch (error) {
    console.error("ensureDownloadUnlocked: token write failed:", error);
  }

  // Lost this specific write (or it errored) - someone else's token may
  // already be there. Re-read rather than assume failure.
  const fresh = await prisma.order.findUnique({
    where: { id: order.id },
    select: { downloadToken: true, downloadTokenExpiresAt: true },
  });
  return {
    downloadUrl: fresh?.downloadToken ? `${siteConfig.url}/digital-store/download/${fresh.downloadToken}` : null,
    downloadTokenExpiresAt: fresh?.downloadTokenExpiresAt ?? null,
    freshlyGenerated: false,
  };
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
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { offering: { select: { title: true, category: true } } },
  });
  if (!order) return null;

  const claim = await prisma.order.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: { status: "PAID", paidAt: new Date() },
  });
  const claimed = claim.count > 0;

  if (!claimed) {
    // Lost the race (or this order was never PENDING to begin with, e.g.
    // called twice for the same already-fulfilled order) - report the
    // current state rather than redoing the account/enrollment work. The
    // download token specifically still gets a self-healing check (see
    // ensureDownloadUnlocked's own comment): an earlier attempt that
    // claimed PENDING->PAID but never got as far as generating it - a
    // transient failure, not a design case - would otherwise leave this
    // order permanently stuck showing no download to a customer who
    // already paid.
    // The winner's own userId write happens after its PENDING->PAID claim,
    // not atomically with it - a loser reading immediately can catch the
    // order PAID but still mid-flight with userId not yet set. A few short
    // retries cover that window without ever blocking on a genuinely
    // incomplete/broken order (same bounded-wait shape as
    // waitForGuestOrderFulfillment in guest-checkout-actions.ts).
    let current = await prisma.order.findUnique({
      where: { id: orderId },
      include: { offering: { select: { title: true, category: true } } },
    });
    for (let attempt = 0; !current?.userId && attempt < 5; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      current = await prisma.order.findUnique({
        where: { id: orderId },
        include: { offering: { select: { title: true, category: true } } },
      });
    }
    if (!current?.userId) return null;

    // Safe to call unconditionally even on the losing side of the race:
    // handleOrderPaid has its own independent idempotency claim
    // (postPurchaseProcessedAt), so this is a no-op if the winner already
    // completed it, and a genuine retry (not previously possible here) if
    // the winner's process died mid-flight after claiming PENDING->PAID but
    // before finishing the operation-item/enrollment/notify/WhatsApp side
    // effects.
    await handleOrderPaid(orderId);

    const { downloadUrl, downloadTokenExpiresAt, freshlyGenerated } = await ensureDownloadUnlocked(current);
    if (freshlyGenerated && current.guestEmail) {
      // The original attempt's email likely never sent either (it comes
      // after token generation in the normal flow) - send the real one now
      // rather than leaving a paying customer with nothing.
      try {
        const firstName = current.guestName?.trim().split(/\s+/)[0] || "there";
        const amountLabel = formatPrice(current.amount, current.currency);
        if (current.offering.category === "DIGITAL_PRODUCT") {
          const { subject, html } = buildDigitalDownloadEmail({
            firstName,
            productName: current.offering.title,
            amountLabel,
            downloadUrl: downloadUrl!,
            expiresAt: downloadTokenExpiresAt!,
          });
          await resend.emails.send({ from: EMAIL_FROM, to: current.guestEmail, subject, html });
        } else if (current.autoLoginToken) {
          const { subject, html } = buildWelcomeEmail({
            firstName,
            courseName: current.offering.title,
            amountLabel,
            email: current.guestEmail,
            autoLoginLink: `${siteConfig.url}/orders/auto-login?token=${current.autoLoginToken}`,
            bonusDownloadUrl: downloadUrl,
          });
          await resend.emails.send({ from: EMAIL_FROM, to: current.guestEmail, subject, html });
        }
      } catch (error) {
        console.error("fulfillGuestOrder: catch-up email failed:", error);
      }
    }

    return {
      claimed: false,
      userId: current.userId,
      autoLoginLink: current.autoLoginToken ? `${siteConfig.url}/orders/auto-login?token=${current.autoLoginToken}` : null,
      downloadUrl,
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

  // Operation item, enrollment (skipped internally for DIGITAL_PRODUCT -
  // same rule this used to apply inline here), the payment-notification
  // Notification (email skipped - guestEmail is set, and the richer
  // welcome/download email below already covers it), and the post-purchase
  // WhatsApp send all run through the one shared, idempotent gate.
  await handleOrderPaid(orderId);

  // A DIGITAL_PRODUCT order has no curriculum to enroll into - the download
  // link below IS its fulfillment. Every other category keeps the existing
  // LMS enrollment unchanged. Still needed here (not just inside
  // handleOrderPaid) to pick the right email template below.
  const isDigitalProduct = order.offering.category === "DIGITAL_PRODUCT";

  const autoLoginLink = `${siteConfig.url}/orders/auto-login?token=${token}`;

  // Either this order IS the digital product, or it's a course order that
  // added the promptsPack bonus at checkout - both unlock a real file via
  // the same downloadToken mechanism (see digital-download.ts and
  // ensureDownloadUnlocked's own comment on why this is a shared, re-entry-
  // safe helper rather than being written inline here).
  const { downloadUrl, downloadTokenExpiresAt } = await ensureDownloadUnlocked({ ...paidOrder, offering: order.offering });

  try {
    // First name only - "Hi Priya" reads like a person wrote it, "Hi Priya Sharma" doesn't.
    const firstName = order.guestName?.trim().split(/\s+/)[0] || "there";
    // The real charged total, so an order that included the prompts pack
    // shows what actually left the buyer's account rather than the
    // offering's own price.
    const amountLabel = formatPrice(order.amount, order.currency);

    if (isDigitalProduct) {
      const { subject, html } = buildDigitalDownloadEmail({
        firstName,
        productName: order.offering.title,
        amountLabel,
        downloadUrl: downloadUrl!,
        expiresAt: downloadTokenExpiresAt!,
      });
      await resend.emails.send({ from: EMAIL_FROM, to: order.guestEmail!, subject, html });
    } else {
      const { subject, html } = buildWelcomeEmail({
        firstName,
        courseName: order.offering.title,
        amountLabel,
        email: order.guestEmail!,
        autoLoginLink,
        bonusDownloadUrl: downloadUrl,
      });
      await resend.emails.send({ from: EMAIL_FROM, to: order.guestEmail!, subject, html });
    }
  } catch (error) {
    console.error("fulfillGuestOrder: welcome email failed:", error);
  }

  // autoLoginLink is returned for every order, digital products included -
  // acceptOrderAutoLogin (guest-checkout-actions.ts) resolves the actual
  // redirect target per order (My Purchases for a digital product,
  // My Learning for a course), so this function doesn't need to know or
  // care which one it's building a link for.
  return { claimed: true, userId, autoLoginLink, downloadUrl };
}
