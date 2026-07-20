import Link from "next/link";
import type { Role } from "@prisma/client";
import { User, Settings, LifeBuoy, LogOut } from "lucide-react";

import { ROLE_LABEL } from "@/config/rbac";
import { signOutAction } from "@/actions/auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export interface ProfileDropdownProps {
  user: { name?: string | null; email?: string | null; role: Role };
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Profile / Settings / Help Center / Sign Out, exactly the brief's list.
 * Profile/Settings/Help Center are minimal, role-agnostic pages (see
 * src/app/profile, /settings, /help) that reuse this same DashboardShell -
 * any authenticated role can reach them, not just the roles this phase
 * builds rich content for.
 */
function ProfileDropdown({ user }: ProfileDropdownProps) {
  const displayName = user.name ?? "Your account";
  const initials = initialsOf(displayName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="bg-primary/10 text-primary hover:ring-ring flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold outline-none transition-shadow hover:ring-2"
        >
          {initials || <User className="size-4" aria-hidden="true" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5 normal-case">
          <span className="text-foreground text-sm font-medium">{displayName}</span>
          {user.email && <span className="text-muted-foreground truncate text-xs">{user.email}</span>}
          <span className="text-muted-foreground text-xs">{ROLE_LABEL[user.role]}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/help">
            <LifeBuoy />
            Help Center
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full">
              <LogOut />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { ProfileDropdown };
