/**
 * Generic route-level fallback - deliberately a spinner, not a skeleton.
 * This file has no knowledge of what content is loading underneath it, so
 * it can't match a specific shape (see design-system.md §21/§22). Once a
 * route's content shape is known, add a route-local loading.tsx there with
 * a matching Skeleton layout instead of relying on this fallback.
 */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className="border-muted border-t-primary h-8 w-8 animate-spin rounded-full border-2"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
