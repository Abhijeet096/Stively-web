import { randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Creates a fresh email-verification token for `userId`, deleting any
 * existing ones first - only the most recently requested link should ever
 * work, so an old, possibly-forwarded email can't verify an account after
 * the user has requested a new one (matters for resendVerificationEmail).
 */
export async function createEmailVerificationToken(userId: string): Promise<string> {
  await prisma.emailVerificationToken.deleteMany({ where: { userId } });
  const token = generateSecureToken();
  await prisma.emailVerificationToken.create({
    data: { userId, token, expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS) },
  });
  return token;
}

/**
 * Consumes (and deletes) an email-verification token if valid, marking the
 * owning user's `emailVerified`. Returns the userId on success, null on any
 * invalid/expired/already-used token - callers render one generic "this
 * link is invalid or has expired" state for all of those, never
 * distinguishing them (no reason to help an attacker enumerate why a token
 * failed).
 */
export async function consumeEmailVerificationToken(token: string): Promise<string | null> {
  const record = await prisma.emailVerificationToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) {
    if (record) await prisma.emailVerificationToken.delete({ where: { token } });
    return null;
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
    prisma.emailVerificationToken.delete({ where: { token } }),
  ]);

  return record.userId;
}

/** Same one-active-token-at-a-time discipline as email verification above. */
export async function createPasswordResetToken(userId: string): Promise<string> {
  await prisma.passwordResetToken.deleteMany({ where: { userId } });
  const token = generateSecureToken();
  await prisma.passwordResetToken.create({
    data: { userId, token, expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS) },
  });
  return token;
}

/**
 * Validates a password-reset token without consuming it - resetPassword
 * (src/actions/auth.ts) deletes it itself only after the new password is
 * successfully hashed and saved, so a failed hash/save never silently
 * burns the user's only valid link.
 */
export async function getValidPasswordResetToken(
  token: string
): Promise<{ userId: string } | null> {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) return null;
  return { userId: record.userId };
}

export async function deletePasswordResetToken(token: string): Promise<void> {
  await prisma.passwordResetToken.delete({ where: { token } }).catch(() => {});
}
