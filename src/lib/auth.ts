import NextAuth, { CredentialsSignin } from "next-auth";
import { cookies } from "next/headers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { PENDING_ROLE_COOKIE } from "@/lib/auth-constants";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_SESSION_SECONDS = 60 * 60 * 24; // 1 day - not "remembered"
const REMEMBER_ME_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Auth.js v5's convention for surfacing a specific reason to the client via
 * `result.error` from `signIn(..., { redirect: false })` - throwing a plain
 * Error collapses to a generic "credentials" code. One subclass per reason
 * the login form (src/components/forms/login-form.tsx) needs to distinguish.
 * (Verify this subclassing contract against current Auth.js v5 docs if
 * upgrading past the beta this project pins - the same discipline
 * docs/phase-d-product-blueprint.md already applied to this file.)
 */
class AccountLockedError extends CredentialsSignin {
  code = "account_locked";
}
class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    // Required whenever a Credentials provider is configured - Auth.js
    // doesn't support the database session strategy for credentials-based
    // sign-in. This also happens to be what makes src/proxy.ts's edge
    // middleware fast: it decodes the JWT locally instead of hitting
    // Prisma on every request. `maxAge` here is the outer ceiling; the
    // `jwt` callback below sets a tighter per-login `exp` for the
    // remember-me distinction.
    strategy: "jwt",
    maxAge: REMEMBER_ME_SECONDS,
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Explicit default, not an accident: an email that already has a
      // Credentials account must NOT be silently linked to a Google
      // sign-in with the same address - that's exactly the account-linking
      // ambiguity docs/phase-d-product-blueprint.md flagged as unresolved.
      // Auth.js instead denies with OAuthAccountNotLinked, which the login
      // form surfaces as "this email already has a password - sign in with
      // your password instead."
      allowDangerousEmailAccountLinking: false,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember me", type: "text" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        const remember = credentials?.remember === "true";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        // No account, or an OAuth-only account with no password set -
        // same generic failure either way, so a login attempt can't be
        // used to enumerate which emails are registered.
        if (!user || !user.password) return null;

        if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
          throw new AccountLockedError();
        }

        const validPassword = await verifyPassword(password, user.password);
        if (!validPassword) {
          const attempts = user.failedLoginAttempts + 1;
          const locking = attempts >= MAX_FAILED_ATTEMPTS;
          await prisma.user.update({
            where: { id: user.id },
            data: locking
              ? { failedLoginAttempts: 0, lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS) }
              : { failedLoginAttempts: attempts },
          });
          if (locking) throw new AccountLockedError();
          return null;
        }

        if (!user.emailVerified) {
          throw new EmailNotVerifiedError();
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
        });

        // `remember` rides along on the returned user object purely to
        // reach the `jwt` callback's initial-sign-in branch below - it's
        // never persisted, just read once and discarded.
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          remember,
        } as unknown as {
          id: string;
          email: string;
          name: string | null;
          image: string | null;
          role: Role;
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  events: {
    // Fires once, right after the adapter creates a brand-new user - the
    // only hook point where a fresh OAuth sign-up's role can be set. The
    // cookie is written by /register's Student/Business buttons
    // (src/app/(auth)/register/page.tsx) right before redirecting into
    // Google; a direct "Continue with Google" from /login (no cookie) gets
    // the STUDENT default, same as the schema's own default.
    async createUser({ user }) {
      const store = await cookies();
      const pendingRole = store.get(PENDING_ROLE_COOKIE)?.value;
      const role: Role = pendingRole === "CLIENT" ? "CLIENT" : "STUDENT";
      await prisma.user.update({
        where: { id: user.id },
        // Google-verified emails are trustworthy - no separate
        // verify-email step for OAuth sign-ups.
        data: { role, emailVerified: new Date() },
      });
    },
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const u = user as unknown as { id: string; role: Role; remember?: boolean };
        token.id = u.id;
        token.role = u.role;
        const seconds = u.remember ? REMEMBER_ME_SECONDS : DEFAULT_SESSION_SECONDS;
        token.exp = Math.floor(Date.now() / 1000) + seconds;
        return token;
      }

      // Skipped in edge middleware (src/proxy.ts also calls `auth()`, but
      // Prisma can't run there without an edge driver this project doesn't
      // have set up) - so role changes and password-reset invalidation
      // take effect on the next real page load, not instantly at the edge.
      // Middleware still routes correctly off the token's existing role in
      // the meantime; this only narrows a rare window, it doesn't remove
      // protection (requireRole in src/lib/session.ts re-checks on render).
      if (token.id && process.env.NEXT_RUNTIME !== "edge" && trigger !== "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true, passwordChangedAt: true },
        });
        if (!dbUser) return null; // user deleted - force sign-out
        if (
          dbUser.passwordChangedAt &&
          typeof token.iat === "number" &&
          dbUser.passwordChangedAt.getTime() / 1000 > token.iat
        ) {
          return null; // password changed after this token was issued
        }
        token.role = dbUser.role;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
