"use client";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield, Lock, AlertTriangle } from "lucide-react";
import { useAuth } from "@/stores/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = useMemo(() => params?.get("next") || "/admin/dashboard", [params]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { setTokens } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      // Call server-side login API that sets cookies
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          nextUrl: next,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Authentication failed");
        setBusy(false);
        return;
      }

      // MFA: continue on the code / enrolment screen, then return to where the admin was headed.
      if (data.requiresOtp || data.mustSetupMfa) {
        const q = `userId=${encodeURIComponent(data.userId)}&tempToken=${encodeURIComponent(data.tempToken)}&next=${encodeURIComponent(data.redirectUrl || next)}`;
        router.push(`${data.requiresOtp ? "/auth/verify-otp" : "/auth/setup-mfa"}?${q}`);
        return;
      }

      // Populate the shared auth store so accessToken-based calls (staff/directory,
      // admin/dashboard, etc.) work immediately without a page reload.
      setTokens(data.token, data.refreshToken || null, data.userId || null);

      // Small delay to ensure cookies are propagated
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Redirect to dashboard
      router.push(data.redirectUrl || next);
    } catch (err: any) {
      setError(err?.message ?? "Authentication failed");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 bg-diagonal-stripes" />

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10">
        {/* Admin Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30 backdrop-blur-sm mb-4">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-300 tracking-widest">ADMIN PORTAL</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">DateBuk Admin</h1>
          <p className="text-slate-400 text-sm">Staff Control Center</p>
        </div>

        {/* Warning Notice */}
        <div className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-500/30 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-300 mb-1">Restricted Access</p>
              <p className="text-red-200/80">
                This area is for authorized staff only. All login attempts are monitored and logged.
              </p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700 p-8 shadow-2xl">
          <form
            className="space-y-5"
            onSubmit={handleLogin}
          >
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="Enter your admin email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-900/50 border border-red-500/50">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={busy}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Shield className="w-5 h-5" />
                  Sign In to Admin Portal
                </span>
              )}
            </Button>

          </form>
        </div>

        {/* Security Footer */}
        <div className="mt-6 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 px-4 py-4 text-center shadow-lg shadow-amber-500/10 backdrop-blur-sm">
          <p className="text-sm font-medium text-amber-200">
            Secure portal for authorized staff and administrators only.
          </p>
          <p className="mt-1 text-xs text-slate-300/80">
            Protected by enterprise-grade security • All actions are audited
          </p>
          <button
            type="button"
            onClick={() => router.push("/staff-login")}
            className="mt-3 text-sm font-medium text-sky-300 hover:text-sky-200 underline decoration-sky-400/60 underline-offset-4 transition-colors"
          >
            Staff Login Here
          </button>
        </div>
      </div>
    </div>
  );
}
