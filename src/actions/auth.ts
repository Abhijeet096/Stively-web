"use server";

import { cookies } from "next/headers";
import { AuthError } from "next-auth";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { signIn, signOut } from "@/lib/auth";
import { PENDING_ROLE_COOKIE } from "@/lib/auth-constants";
import {
  createEmailVerificationToken,
  createPasswordResetToken,
  getValidPasswordResetToken,
  deletePasswordResetToken,
} from "@/lib/auth-tokens";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { siteConfig } from "@/config/site";

/**
 * `signIn()` signals its own success by throwing Next.js's internal
 * redirect error (digest starting with "NEXT_REDIRECT") when `redirectTo`
 * is set - that has to be re-thrown, not swallowed, or the redirect never
 * happens. Checked by digest string rather than importing Next's internal
 * `isRedirectError` helper (not part of the public API, and this project
 * pins a nonstandard Next.js build per AGENTS.md - see that file's warning
 * about relying on internals here).
 */
function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

/**
 * Same shape as src/actions/leads.ts's ActionResult, widened with an
 * optional `message` - the auth flows below need to say more on success
 * than "it worked" (e.g. "check your email"), which a bare boolean can't
 * carry.
 */
export type AuthActionResult =
  | { success: true; message?: string }
  | { success: false; error: string };

const GENERIC_RESET_MESSAGE =
  "If an account exists for that email, we've sent a link to reset the password.";

async function sendVerificationEmail(to: string, name: string | null, userId: string) {
  const token = await createEmailVerificationToken(userId);
  const url = `${siteConfig.url}/verify-email?token=${token}`;
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Verify your Stively account",
    html: `<p>Hi ${name ?? "there"},</p><p>Confirm your email to finish setting up your Stively account:</p><p><a href="${url}">Verify email address</a></p><p>This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>`,
  });
}

/**
 * Registration only ever accepts role STUDENT or CLIENT - see
 * src/lib/validations/auth.ts's registerSchema, which is the actual
 * enforcement point (every other Role value is a type error here, not
 * just a UI convention). Every other role is assigned by an admin later.
 */
export async function registerUser(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    role: formData.get("role"),
    companyName: formData.get("companyName") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return { success: false, error: "An account with this email already exists." };
    }

    const passwordHash = await hashPassword(data.password);
    const now = new Date();
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: passwordHash,
        role: data.role,
        companyName: data.role === "CLIENT" ? data.companyName : null,
        passwordChangedAt: now,
      },
    });

    await sendVerificationEmail(user.email!, user.name, user.id);

    return {
      success: true,
      message: "Account created. Check your email to verify your address before signing in.",
    };
  } catch (error) {
    console.error("registerUser failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Deliberately returns the same generic message whether or not the email
 * belongs to a real account - a distinguishable response here is a classic
 * user-enumeration leak (see OWASP's forgot-password guidance).
 */
export async function requestPasswordReset(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

    if (user?.password) {
      const token = await createPasswordResetToken(user.id);
      const url = `${siteConfig.url}/reset-password?token=${token}`;
      await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email!,
        subject: "Reset your Stively password",
        html: `<p>Hi ${user.name ?? "there"},</p><p>Reset your password using the link below:</p><p><a href="${url}">Reset password</a></p><p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
      });
    } else if (user && !user.password) {
      // OAuth-only account - nudge them toward the sign-in method they
      // actually have instead of a reset link for a password that doesn't
      // exist. Same outward response either way, per the comment above.
      await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email!,
        subject: "Sign in to Stively",
        html: `<p>Hi ${user.name ?? "there"},</p><p>This Stively account was created with Google sign-in and has no password to reset - use "Continue with Google" on the sign-in page instead.</p>`,
      });
    }

    return { success: true, message: GENERIC_RESET_MESSAGE };
  } catch (error) {
    console.error("requestPasswordReset failed:", error);
    // Still generic - an internal failure shouldn't tell an attacker
    // anything either.
    return { success: true, message: GENERIC_RESET_MESSAGE };
  }
}

export async function resetPassword(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const record = await getValidPasswordResetToken(parsed.data.token);
    if (!record) {
      return { success: false, error: "This reset link is invalid or has expired." };
    }

    const passwordHash = await hashPassword(parsed.data.password);
    await prisma.user.update({
      where: { id: record.userId },
      data: {
        password: passwordHash,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    await deletePasswordResetToken(parsed.data.token);

    return { success: true, message: "Password updated. You can now sign in." };
  } catch (error) {
    console.error("resetPassword failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/** Same generic-response discipline as requestPasswordReset - see its comment. */
export async function resendVerificationEmail(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  const genericMessage = "If that account needs verifying, we've sent a new link.";
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (user && user.password && !user.emailVerified) {
      await sendVerificationEmail(user.email!, user.name, user.id);
    }
    return { success: true, message: genericMessage };
  } catch (error) {
    console.error("resendVerificationEmail failed:", error);
    return { success: true, message: genericMessage };
  }
}

/**
 * On success, `signIn()` throws Next's redirect signal and this function
 * never actually returns - src/components/forms/login-form.tsx's
 * useActionState only ever observes the failure path. Defaults
 * `redirectTo` to `/login` itself (not "/"), which looks circular but
 * isn't: src/proxy.ts bounces an authenticated visitor away from `/login`
 * to their own ROLE_HOME, so this reuses that logic instead of duplicating
 * a "look up the user's role and redirect" step here.
 */
export async function loginUser(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    remember: formData.get("remember") === "on",
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const callbackUrl = (formData.get("callbackUrl") as string | null) || "/login";

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      remember: String(parsed.data.remember),
      redirectTo: callbackUrl,
    });
    return { success: true };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;

    if (error instanceof AuthError) {
      const code = "code" in error ? (error as { code?: string }).code : undefined;
      if (code === "account_locked") {
        return {
          success: false,
          error: "Too many failed attempts. Your account is temporarily locked - try again in 15 minutes.",
        };
      }
      if (code === "email_not_verified") {
        return { success: false, error: "Please verify your email before signing in." };
      }
      return { success: false, error: "Invalid email or password." };
    }

    console.error("loginUser failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Backs the "Continue with Google" button on both /login and /register
 * (src/components/forms/login-form.tsx, register-form.tsx). `role` is only
 * meaningful from /register - it's staged into a short-lived cookie that
 * src/lib/auth.ts's `events.createUser` reads once, for brand-new accounts
 * only. Same redirectTo-defaults-to-/login trick as loginUser above.
 */
export async function googleSignIn(formData: FormData): Promise<void> {
  const role = formData.get("role");
  if (role === "STUDENT" || role === "CLIENT") {
    const store = await cookies();
    store.set(PENDING_ROLE_COOKIE, role, {
      httpOnly: true,
      maxAge: 300,
      path: "/",
      sameSite: "lax",
    });
  }

  const callbackUrl = (formData.get("callbackUrl") as string | null) || "/login";
  await signIn("google", { redirectTo: callbackUrl });
}

/** Used by ProfileDropdown's sign-out item - see src/components/dashboard-shell/profile/profile-dropdown.tsx. */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
