"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, ChevronRight, LogOut } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { enterpriseSections } from "@/components/dashboard/EnterpriseSidebar";

interface MobileEnterpriseDrawerProps {
  user?: {
    name?: string;
    avatar?: string;
  };
}

export function MobileEnterpriseDrawer({ user }: MobileEnterpriseDrawerProps) {
  const pathname = usePathname();
  const safePathname = pathname ?? "";
  const [open, setOpen] = useState(false);

  const defaultOpen = useMemo(() => {
    const openTitles = new Set<string>(["DASHBOARD", "SYSTEM"]);
    enterpriseSections.forEach((section) => {
      if (section.items.some((item) => safePathname === item.href || safePathname.startsWith(`${item.href}/`))) {
        openTitles.add(section.title);
      }
    });
    return openTitles;
  }, [safePathname]);

  const [openSections, setOpenSections] = useState<Set<string>>(defaultOpen);

  useEffect(() => {
    setOpenSections(defaultOpen);
  }, [defaultOpen]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const currentUser = useCurrentUser();
  // Pages pass a placeholder ({ name: "You" }) when they have no user of their own;
  // prefer the real signed-in user over that placeholder.
  const passedName = user?.name?.trim();
  const hasRealName = !!passedName && passedName !== "You";
  const userName = (hasRealName ? passedName : currentUser?.name) || passedName || "You";
  const userAvatar = user?.avatar || currentUser?.avatar;

  const toggleSection = (title: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  return (
    <>
      <button
        type="button"
        title="Open navigation"
        onClick={() => setOpen(true)}
        className="lg:hidden fixed left-3 top-[max(0.75rem,env(safe-area-inset-top))] sm:left-4 sm:top-[max(1rem,env(safe-area-inset-top))] z-50 inline-flex items-center gap-2 rounded-full border border-pink-300 bg-white/95 px-3.5 py-2.5 text-sm font-medium text-gray-800 shadow-xl backdrop-blur"
      >
        <Menu size={16} />
        <span>Menu</span>
      </button>

      {open ? (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <button
            type="button"
            title="Close navigation overlay"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/45"
          />

          <aside className="absolute left-0 top-0 h-full w-[88vw] max-w-sm bg-white shadow-2xl flex flex-col border-r border-pink-200">
            <div className="p-4 border-b border-pink-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-pink-500/40">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback>{userName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900">{userName}</p>
                  <p className="text-xs text-green-600">Online</p>
                </div>
              </div>

              <button
                type="button"
                title="Close menu"
                onClick={() => setOpen(false)}
                className="p-2 rounded-md hover:bg-pink-50 text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {enterpriseSections.map((section) => (
                <section key={section.title}>
                  <button
                    type="button"
                    title={`Toggle ${section.title.toLowerCase()} section`}
                    onClick={() => toggleSection(section.title)}
                    className="w-full mb-2 px-2 py-2 text-[11px] font-bold tracking-widest text-gray-500 uppercase flex items-center justify-between rounded hover:bg-pink-50"
                  >
                    <span className="flex items-center gap-2">
                      <span>{section.icon}</span>
                      <span>{section.title}</span>
                    </span>
                    {openSections.has(section.title) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {openSections.has(section.title) ? (
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const isActive = safePathname === item.href || safePathname.startsWith(`${item.href}/`);

                        return (
                          <Link
                            key={`${section.title}-${item.label}`}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                              isActive
                                ? "bg-gradient-to-r from-pink-200 to-purple-200 text-gray-900"
                                : "text-gray-700 hover:bg-pink-50"
                            }`}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </section>
              ))}
            </div>

            <div className="p-3 border-t border-pink-200">
              <Link
                href="/logout"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
