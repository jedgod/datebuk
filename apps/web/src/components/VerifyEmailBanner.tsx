"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/stores/auth";
import { api } from "@/lib/api";

export function VerifyEmailBanner() {
  const accessToken = useAuth((s) => s.accessToken);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    api
      .get<{ emailVerified?: boolean }>("/users/me", accessToken)
      .then((user) => { if (!cancelled) setEmailVerified(!!user?.emailVerified); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [accessToken]);

  if (!accessToken || emailVerified !== false) return null;

  const resend = async () => {
    setSending(true);
    try {
      await api.post("/auth/send-verification", undefined, accessToken);
      setSent(true);
    } catch {
      // Leave the button available so the user can retry.
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-sm text-amber-900 flex flex-wrap items-center justify-between gap-3">
      <span>Verify your email to unlock Discover, messaging, calls, profile photos, and concierge services.</span>
      <button
        type="button"
        onClick={resend}
        disabled={sending || sent}
        className="shrink-0 rounded-full bg-amber-600 text-white px-4 py-1.5 text-xs font-semibold hover:bg-amber-700 disabled:opacity-60"
      >
        {sent ? "Email sent — check your inbox" : sending ? "Sending…" : "Resend verification email"}
      </button>
    </div>
  );
}
