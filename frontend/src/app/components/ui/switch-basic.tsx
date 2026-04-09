"use client";

import { Switch } from "@ark-ui/react/switch";
import { ReactNode } from "react";

export function SwitchBasic({ checked, onCheckedChange, children }: { checked?: boolean, onCheckedChange?: (e: { checked: boolean }) => void, children?: ReactNode }) {
    return (
        <Switch.Root checked={checked} onCheckedChange={onCheckedChange} className="flex items-center gap-3 cursor-pointer">
            <Switch.Control className="relative inline-flex w-11 p-0.5 items-center rounded-full bg-gray-300 transition-colors duration-200 ease-in-out data-[state=checked]:bg-emerald-500 data-focus-visible:ring-2 data-focus-visible:ring-gray-300/50 data-[state=checked]:data-focus-visible:ring-gray-300/50 dark:bg-gray-600 dark:data-[state=checked]:bg-emerald-500">
                <Switch.Thumb className="w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out data-[state=checked]:translate-x-full" />
            </Switch.Control>
            <Switch.HiddenInput />
            {children && <Switch.Label className="text-sm font-medium">{children}</Switch.Label>}
        </Switch.Root>
    );
}
