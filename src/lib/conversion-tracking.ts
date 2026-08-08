/**
 * The one place a "this conversion is pending" handoff key lives, shared
 * between whatever triggers a conversion funnel's redirect (e.g.
 * start-project-form.tsx) and whatever actually fires the Google Ads
 * conversion event on the destination page (e.g. StartProjectConversion).
 * sessionStorage, not a query param on the /thank-you URL - a query param
 * would make the "real submission" signal shareable/bookmarkable (anyone
 * who copies a link containing it could trigger a false conversion just by
 * opening it), where sessionStorage only survives within the same tab that
 * set it, and is consumed (read once, then cleared) the moment it's used.
 */
export const START_PROJECT_CONVERSION_KEY = "stively:start-project-conversion-pending";

/** Called right before navigating a successful /start-project submission to /thank-you - marks that the very next /thank-you mount, in this tab, is allowed to fire the Google Ads conversion event. */
export function markStartProjectConversionPending(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(START_PROJECT_CONVERSION_KEY, "1");
  } catch {
    // Private browsing / storage disabled - conversion just won't fire for
    // this visitor, same as any other browser restriction. Never block the
    // actual redirect over this.
  }
}
