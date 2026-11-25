// components/staff/SidebarNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { filterStaffSafeNavItems } from "@/lib/staff/navigation-guard";
import {
  LayoutDashboard,
  Ticket,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "My Queue", url: "/staff" },
  { icon: Ticket, label: "All Tickets", url: "/staff/tickets" },
  { icon: Users, label: "Users Search", url: "/staff/users" },
  { icon: MessageSquare, label: "Live Chats", url: "/staff/chats" },
  { icon: BarChart3, label: "Reports", url: "/staff/reports" },
  { icon: Settings, label: "Settings", url: "/staff/settings", className: "mt-auto" },
];

export function SidebarNav() {
  const pathname = usePathname() || "";
  const safeNavItems = filterStaffSafeNavItems(navItems);

  return (
    <div className="flex h-full flex-col">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold">Staff Dashboard</h2>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {safeNavItems.map((item) => {
            const isActive = pathname === item.url || pathname.startsWith(item.url + "/");

            return (
              <Link
                key={item.label}
                href={item.url}
                className={cn(
                  "flex w-full items-center gap-3 rounded-none border-l-2 px-3 py-2 text-left text-sm transition-colors",
                  isActive
                    ? "border-blue-500 bg-blue-50 text-blue-800 font-semibold dark:bg-blue-900/30 dark:text-blue-200"
                    : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800",
                  item.className
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}
