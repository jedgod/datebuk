"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/auth";
import { performLogout } from "@/lib/logout";

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    // Perform logout and redirect to home/login
    performLogout({
      logout,
      router,
      redirectTo: "/",
      toastMessage: "Logged out successfully",
    });
  }, [logout, router]);

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-500 to-purple-600">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg font-semibold">Logging out...</p>
        <p className="text-pink-100 text-sm mt-2">Redirecting to home page</p>
      </div>
    </div>
  );
}
