"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "secondary" | "ghost" | "outline" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
};

export function Button({ className, variant="primary", size="md", ...props }: Props) {
  const base = "inline-flex items-center justify-center rounded-xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string,string> = {
    default: "bg-black text-white hover:bg-black/90 shadow-soft",
    primary: "bg-black text-white hover:bg-black/90 shadow-soft",
    secondary: "bg-white text-black border border-black/10 hover:bg-black/5",
    ghost: "bg-transparent text-black hover:bg-black/5",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  };
  const sizes: Record<string,string> = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-sm",
    lg: "h-12 px-5 text-base",
    icon: "h-10 w-10",
  };
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
