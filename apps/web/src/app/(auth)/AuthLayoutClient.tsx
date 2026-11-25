"use client";

import { usePathname } from "next/navigation";

export function AuthLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSignup = pathname?.includes('/signup');

  if (isSignup) {
    // Full-screen layout for signup flow
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 relative">
        {/* Background Image */}
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{ backgroundImage: 'url(/hero-bg.png)' }}
        />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }

  // Centered card layout for login and other auth pages
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 px-6 relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-70"
        style={{ backgroundImage: 'url(/hero-bg.png)' }}
      />
      
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-3xl shadow-soft border border-black/5 relative z-10">
        {children}
      </div>
    </div>
  );
}
