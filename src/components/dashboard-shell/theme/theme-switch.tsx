"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Check } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

const subscribeNoop = () => () => {};

/**
 * The root layout defaults to `light` with `enableSystem={false}` (see
 * src/app/layout.tsx's comment on why) - this switch is what actually
 * lets a signed-in user opt into dark or system-follow from inside the
 * dashboard. `mounted` guards against a hydration mismatch: next-themes
 * can't know the real theme on the server, so the icon renders a neutral
 * placeholder until the client confirms it. Read via `useSyncExternalStore`
 * (server snapshot `false`, client snapshot `true`) rather than the usual
 * `useState(false) + useEffect(() => setState(true))` mount-detection
 * pattern - this project's lint config flags synchronous setState-in-effect,
 * and this is the effect-free equivalent for "has this component hydrated."
 */
function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );

  const current = OPTIONS.find((option) => option.value === theme) ?? OPTIONS[0];
  const Icon = mounted ? current.icon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change theme">
          <Icon className="size-[18px]" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40">
        {OPTIONS.map((option) => (
          <DropdownMenuItem key={option.value} onSelect={() => setTheme(option.value)}>
            <option.icon aria-hidden="true" />
            <span className="flex-1">{option.label}</span>
            {mounted && theme === option.value && (
              <Check className="text-foreground size-3.5" aria-hidden="true" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { ThemeSwitch };
