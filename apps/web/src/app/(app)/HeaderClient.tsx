"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { performLogout } from "@/lib/logout";

export function HeaderClient() {
  const pathname = usePathname();
  const router = useRouter();
  const { hydrate, isHydrated, accessToken, logout } = useAuth();

  useEffect(() => {
    if (!isHydrated) hydrate();
  }, [hydrate, isHydrated]);

  useEffect(() => {
    // client-side backup in case cookies are missing
    if (isHydrated && !accessToken) router.push(`/login?next=${encodeURIComponent(pathname || '/')}`);
  }, [accessToken, isHydrated, pathname, router]);

  return (
    <header className="sticky top-0 z-30 border-b border-pink-100 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
        >
          DateBuk
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link className="px-3 py-2 rounded-xl text-gray-700 hover:bg-pink-50 hover:text-pink-700" href="/discover">Discover</Link>
          <Link className="px-3 py-2 rounded-xl text-gray-700 hover:bg-pink-50 hover:text-pink-700" href="/matches">Matches</Link>
          <Link className="px-3 py-2 rounded-xl text-gray-700 hover:bg-pink-50 hover:text-pink-700" href="/messages">Messages</Link>
          <Link className="px-3 py-2 rounded-xl text-gray-700 hover:bg-pink-50 hover:text-pink-700" href="/video-call/demo-room">Video</Link>
          <Link className="px-3 py-2 rounded-xl text-gray-700 hover:bg-pink-50 hover:text-pink-700" href="/profile">Profile</Link>
          <Link className="px-3 py-2 rounded-xl text-gray-700 hover:bg-pink-50 hover:text-pink-700" href="/settings">Settings</Link>
          <Button
            size="sm"
            className="bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700"
            onClick={() =>
              performLogout({
                logout,
                router,
                redirectTo: "/login",
                toastMessage: "Logged out",
              })
            }
          >
            Logout
          </Button>
        </nav>
      </div>
    </header>
  );
}
