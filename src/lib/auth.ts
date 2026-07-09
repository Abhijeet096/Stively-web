import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

import { prisma } from "@/lib/prisma";

/**
 * Sign-in methods: Google OAuth + Resend magic-link email. Deliberately no
 * password/credentials provider.
 *
 * Why: a training platform's users are one-time-per-cohort visitors, not
 * daily-active users who benefit from a saved password. Passwords mean we'd
 * own hashing, reset flows, and breach liability for zero UX benefit over
 * a one-tap magic link. Every product in the design brief (Notion, Linear,
 * Vercel) defaults to this same pattern for the same reason.
 *
 * Session strategy is "database" (not JWT) because the Resend/email
 * provider requires it - verification tokens and session lookups go
 * through the Prisma adapter.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM ?? "Stively <login@stively.com>",
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
    error: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
  },
});
