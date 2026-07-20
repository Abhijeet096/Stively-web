"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

/** URL-driven (?q=), same debounced-push pattern as offering-toolbar.tsx's search box - server-rendered results, no client-side fetch. */
function SearchLessons() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [value, setValue] = React.useState(urlQuery);

  const [lastUrlQuery, setLastUrlQuery] = React.useState(urlQuery);
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    setValue(urlQuery);
  }

  React.useEffect(() => {
    const handle = setTimeout(() => {
      if (value !== urlQuery) {
        const params = new URLSearchParams(searchParams.toString());
        if (value.trim()) params.set("q", value.trim());
        else params.delete("q");
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
      }
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative max-w-xs">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden="true" />
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search this course..."
        className="pl-9"
        aria-label="Search lessons"
      />
    </div>
  );
}

export { SearchLessons };
