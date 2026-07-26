import "server-only";

/**
 * Vercel sends `Authorization: Bearer $CRON_SECRET` automatically on
 * cron-triggered requests once CRON_SECRET is set as a Vercel project env
 * var - no custom header scheme invented, just checking Vercel's own
 * documented convention.
 */
export function isValidCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}
