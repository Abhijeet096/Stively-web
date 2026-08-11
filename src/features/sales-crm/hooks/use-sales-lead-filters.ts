"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

/** Same URL-driven filter pattern as operations/hooks/use-operation-filters.ts. */
export function useSalesLeadFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /** Applies several key changes in one navigation - needed when one filter's meaning conflicts with another (e.g. picking an exact status should clear the coarser `stage` grouping) and both need to land in a single URL update, not two racing pushes. */
  const setFilters = useCallback(
    (patch: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      params.delete("page");
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [router, pathname, searchParams]
  );

  const setFilter = useCallback((key: string, value: string | undefined) => setFilters({ [key]: value }), [setFilters]);

  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  return { searchParams, setFilter, setFilters, clearFilters };
}
