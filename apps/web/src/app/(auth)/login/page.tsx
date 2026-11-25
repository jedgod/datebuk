"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TextField } from "@/components/ui/textfield";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/stores/auth";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0`;
}

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = useMemo(() => params?.get("next") || "/dashboard", [params]);
  const { login, accessToken, hydrate, isHydrated } = useAuth();

  const [email, setEmail] = useState("emma@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  useEffect(() => {
    if (!isHydrated) hydrate();
  }, [hydrate, isHydrated]);

  // Only redirect if user just successfully logged in (not on initial page load)
  useEffect(() => {
    if (!accessToken || !justLoggedIn) return;
    setCookie("dp_access", accessToken);
    clearCookie("dp_admin");
    router.push(next);
  }, [accessToken, justLoggedIn, next, router]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Welcome back</h1>
        <p className="text-sm text-black/70 mt-1">Sign in to view matches.</p>
      </div>

      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            const result = await login(email, password);
            if (result.requiresOtp) {
              const query = new URLSearchParams({
                userId: result.userId,
                tempToken: result.tempToken,
                next,
              });
              router.push(`/auth/verify-otp?${query.toString()}`);
              return;
            }
            setJustLoggedIn(true);
          } catch (err: any) {
            setError(err?.message ?? "Login failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        <Button type="submit" disabled={busy} className="w-full">{busy ? "Signing in..." : "Sign in"}</Button>
        <div className="flex items-center justify-between text-sm">
          <button type="button" className="font-semibold underline" onClick={() => router.push("/request-reset")}>Forgot password?</button>
          <button type="button" className="font-semibold underline" onClick={() => router.push("/signup")}>Create account</button>
        </div>
      </form>
    </div>
  );
}
