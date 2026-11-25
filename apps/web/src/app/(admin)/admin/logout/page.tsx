"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/auth";
import { performLogout } from "@/lib/logout";

export default function AdminLogoutPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    if (hasLoggedOut.current) return;
    hasLoggedOut.current = true;

    performLogout({
      logout,
      router,
      redirectTo: "/admin/login",
      toastMessage: "Admin logged out",
    });
  }, [logout, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="text-center">
        <div className="text-sm font-semibold tracking-wide text-slate-300">Signing you out...</div>
      </div>
    </div>
  );
}
