"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function TextField({ className, label, error, ...props }: Props) {
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-sm font-semibold text-black/80">{label}</span> : null}
      <input
        className={cn(
          "h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none transition",
          "focus:border-black/30 focus:ring-2 focus:ring-black/10",
          error ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "",
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
