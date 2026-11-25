"use client";

import * as React from "react";

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  title?: string;
}

export function Switch({
  checked = false,
  onCheckedChange,
  disabled = false,
  className = "",
  title = "Toggle",
}: SwitchProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onCheckedChange?.(!checked);
      }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
        checked ? "bg-pink-500/80 border-pink-500/60" : "bg-slate-200 border-slate-300"
      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${className}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}