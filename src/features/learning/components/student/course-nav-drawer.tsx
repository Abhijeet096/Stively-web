"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

/**
 * Mobile course navigation. Takes the sidebar as `children` so the exact
 * same Server Component renders in the drawer and in the desktop rail -
 * lock and completion state can't drift between the two because there's
 * only one implementation.
 *
 * Closes itself when the route or selected item changes, which is what
 * makes "tap a lesson -> drawer closes -> you're on the lesson" work
 * without every link needing its own close handler.
 */
function CourseNavDrawer({ children, label }: { children: React.ReactNode; label: string }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = `${pathname}?${searchParams.toString()}`;
  const lastKey = React.useRef(key);

  React.useEffect(() => {
    if (lastKey.current !== key) {
      lastKey.current = key;
      setOpen(false);
    }
  }, [key]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Open course content"
        className="gap-2"
      >
        <Menu className="size-4" aria-hidden="true" />
        Contents
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[88vw] max-w-sm p-0">
          <SheetTitle className="sr-only">{label}</SheetTitle>
          <div className="h-full overflow-hidden pt-2">{children}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export { CourseNavDrawer };
