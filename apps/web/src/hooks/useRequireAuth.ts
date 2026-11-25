"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/auth";

export function useRequireAuth(nextPath: string) {
  const router = useRouter();
  const { accessToken, isHydrated, hydrate } = useAuth();
  // The auth store seeds itself from localStorage when the module loads, so on the client
  // the very first render already has a token while the server render never does. Pages
  // that branch on isAuthenticated would then hydrate with different markup. Report
  // "not authenticated" until after mount so both renders agree.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isHydrated) hydrate();
  }, [hydrate, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!accessToken) {
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
    }
  }, [accessToken, isHydrated, nextPath, router]);

  return {
    accessToken,
    isHydrated,
    isAuthenticated: mounted && Boolean(accessToken),
  };
}
