import type { Metadata } from "next";
import { Settings } from "lucide-react";

import { EmptyState } from "@/components/sections/empty-state";

export const metadata: Metadata = { title: "Settings" };

/** Placeholder, per this task's explicit sidebar spec. */
export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Settings</h1>
      <EmptyState
        icon={Settings}
        title="Settings are coming soon"
        description="Account and workspace settings will live here."
      />
    </div>
  );
}
