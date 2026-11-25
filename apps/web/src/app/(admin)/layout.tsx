"use client";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login" || pathname === "/admin/staff/login";
  
  // Create QueryClient instance (persisted during component lifecycle)
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
          },
        },
      }),
    []
  );

  // Login page has its own full-page layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <QueryClientProvider client={queryClient}>
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Admin Header Bar */}
      <div className="border-b border-amber-500/30 bg-gradient-to-r from-amber-900/40 to-orange-900/40 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)] animate-pulse" />
              <div className="absolute inset-0 h-3 w-3 rounded-full bg-amber-500 blur-sm animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wider text-amber-300">
                DATEBUK
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs font-semibold tracking-widest text-amber-200">
                ADMIN CONTROL CENTER
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-slate-300">System Operational</span>
            </div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
              Staff Only
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="bg-slate-50 text-slate-900 min-h-[calc(100vh-60px)]">
        {children}
      </div>
      
      {/* Footer Notice */}
      <div className="bg-slate-900 border-t border-slate-700 py-3">
        <div className="mx-auto max-w-[1400px] px-4 text-center">
          <p className="text-xs text-slate-400">
            🔒 Restricted Access • Admin Dashboard • All actions are logged and monitored
          </p>
        </div>
      </div>
    </div>
    </QueryClientProvider>
  );
}
