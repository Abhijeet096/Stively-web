/**
 * Shared between src/app/(auth)/register/page.tsx (writes the cookie
 * before redirecting into Google OAuth) and src/lib/auth.ts's
 * `events.createUser` (reads it once for a brand-new account's role) - a
 * standalone constants file so neither side has to import the other.
 */
export const PENDING_ROLE_COOKIE = "stively_pending_role";
