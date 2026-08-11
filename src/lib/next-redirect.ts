/**
 * `signIn()` signals its own success by throwing Next.js's internal
 * redirect error (digest starting with "NEXT_REDIRECT") when `redirectTo`
 * is set - that has to be re-thrown, not swallowed, or the redirect never
 * happens. Checked by digest string rather than importing Next's internal
 * `isRedirectError` helper (not part of the public API, and this project
 * pins a nonstandard Next.js build per AGENTS.md - see that file's warning
 * about relying on internals here). Lives in a plain module, not
 * src/actions/auth.ts, because every export of a "use server" file must be
 * an async Server Action - a sync helper can't be exported from one.
 */
export function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}
