/**
 * Shared between src/app/(auth)/register/page.tsx (writes the cookie
 * before redirecting into Google OAuth) and src/lib/auth.ts's
 * `events.createUser` (reads it once for a brand-new account's role) - a
 * standalone constants file so neither side has to import the other.
 */
export const PENDING_ROLE_COOKIE = "stively_pending_role";

/**
 * Set by submitLead (src/actions/leads.ts) whenever a visitor submits a
 * contact/start-project form with an email, read server-side by /register to
 * prefill (never lock - see AD-017) the email field for someone who
 * inquired first and comes back to create an account later. httpOnly, same
 * as PENDING_ROLE_COOKIE - nothing here needs client-side JS access.
 */
export const RECENT_LEAD_EMAIL_COOKIE = "stively_recent_lead_email";
