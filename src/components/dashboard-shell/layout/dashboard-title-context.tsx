"use client";

import * as React from "react";

interface DashboardTitleContextValue {
  title: string;
  setTitle: (title: string) => void;
}

const DashboardTitleContext = React.createContext<DashboardTitleContextValue | null>(null);

/**
 * Wraps the whole dashboard shell (see dashboard-shell.tsx) so Topbar can
 * render a page's title without prop-drilling it through every layout
 * file between a Server Component page and the shell that renders around
 * it. Individual pages set their title by rendering `<SetPageTitle
 * title="..." />` once near the top of their content - see that
 * component's own doc comment for why a component, not a hook call, is
 * the entry point pages use.
 */
function DashboardTitleProvider({
  children,
  defaultTitle,
}: {
  children: React.ReactNode;
  defaultTitle: string;
}) {
  const [title, setTitle] = React.useState(defaultTitle);
  const value = React.useMemo(() => ({ title, setTitle }), [title]);

  return (
    <DashboardTitleContext.Provider value={value}>{children}</DashboardTitleContext.Provider>
  );
}

function useDashboardTitle(): DashboardTitleContextValue {
  const ctx = React.useContext(DashboardTitleContext);
  if (!ctx) {
    throw new Error("useDashboardTitle must be used within a DashboardTitleProvider");
  }
  return ctx;
}

/**
 * The actual per-page entry point. A plain hook call wouldn't work directly
 * inside a page, since every dashboard page here is (and should stay) an
 * `async` Server Component - this tiny Client Component is the one place
 * that crosses into `useEffect` to push a title up to the shell without
 * forcing the whole page to become a Client Component.
 */
function SetPageTitle({ title }: { title: string }) {
  const { setTitle } = useDashboardTitle();
  React.useEffect(() => {
    setTitle(title);
  }, [title, setTitle]);
  return null;
}

export { DashboardTitleProvider, useDashboardTitle, SetPageTitle };
