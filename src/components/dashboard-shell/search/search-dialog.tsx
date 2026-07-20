"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SEARCH_RESULTS } from "@/components/dashboard-shell/search/search-data";

export interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Client-side filter over a static result list (see search-data.ts) - no
 * backend exists yet. Grouped by `group`, keyboard-navigable (Up/Down move
 * a highlighted index, Enter navigates), and closes itself on selection.
 * This is deliberately the only place result-fetching logic would need to
 * change (a `useState` → a debounced query) when real search ships.
 */
function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEARCH_RESULTS;
    return SEARCH_RESULTS.filter(
      (result) =>
        result.label.toLowerCase().includes(q) || result.description.toLowerCase().includes(q)
    );
  }, [query]);

  // Resetting derived state when an input changes belongs during render,
  // not in a useEffect (see https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  // - it avoids the extra "commit, then re-render" round trip an effect
  // would cost, and this project's lint config enforces the render-time
  // form via react-hooks/set-state-in-effect.
  const [prevResults, setPrevResults] = React.useState(results);
  if (results !== prevResults) {
    setPrevResults(results);
    setActiveIndex(0);
  }

  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) setQuery("");
  }

  const select = React.useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router]
  );

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      select(results[activeIndex].href);
    }
  }

  const groups = React.useMemo(() => {
    const map = new Map<string, typeof results>();
    for (const result of results) {
      const list = map.get(result.group) ?? [];
      list.push(result);
      map.set(result.group, list);
    }
    return map;
  }, [results]);

  let flatIndex = -1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-24 max-w-xl translate-y-0 gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Search</DialogTitle>

        <div className="border-border flex items-center gap-3 border-b px-4">
          <Search className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search programs, pages, and more..."
            aria-label="Search"
            className="text-foreground placeholder:text-muted-foreground h-14 flex-1 bg-transparent text-sm outline-none"
          />
          <kbd className="border-border text-muted-foreground hidden rounded-md border px-1.5 py-0.5 text-xs sm:inline-block">
            Esc
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2" role="listbox" aria-label="Search results">
          {results.length === 0 ? (
            <p className="text-muted-foreground px-3 py-8 text-center text-sm">
              No results for &ldquo;{query}&rdquo;.
            </p>
          ) : (
            [...groups.entries()].map(([group, items]) => (
              <div key={group} className="flex flex-col gap-0.5 pb-2">
                <p className="text-muted-foreground px-2.5 py-1.5 text-xs font-medium tracking-wide uppercase">
                  {group}
                </p>
                {items.map((result) => {
                  flatIndex += 1;
                  const isActive = flatIndex === activeIndex;
                  return (
                    <button
                      key={result.href + result.label}
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveIndex(flatIndex)}
                      onClick={() => select(result.href)}
                      className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors duration-100 ${
                        isActive ? "bg-accent text-foreground" : "text-foreground"
                      }`}
                    >
                      <result.icon
                        className="text-muted-foreground size-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="flex-1 truncate">{result.label}</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {result.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { SearchDialog };
