"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

/**
 * Instant, URL-driven filter state for OfferingToolbar - every change is a
 * real navigation (shareable, bookmarkable URL), just triggered by a Select
 * `onValueChange`/debounced input instead of a submit button. An
 * intentional upgrade over training-filters.tsx's native-select GET-form
 * pattern: that file's own comment notes no Select primitive existed yet
 * when it was built - one now does (src/components/ui/select.tsx).
 */
export function useOfferingFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page"); // any filter change resets to page 1
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [router, pathname, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  return { searchParams, setFilter, clearFilters };
}
