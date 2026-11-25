"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type Status = {
  verified: boolean;
  status: "NONE" | "PENDING_CAPTURE" | "PROCESSING" | "APPROVED" | "REJECTED" | "EXPIRED";
  reason: string | null;
  attemptsLeft: number;
};

type StartResponse = { delivery: "queued" | "logged"; phoneLast4: string; expiresAt: string };

// Registration step 2 (web): collect a mobile number and text a one-time link so the user
// can scan their ID and take a selfie on their phone. This page then waits for the result.
export default function VerifyIdentityPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useRequireAuth("/verify-identity");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<StartResponse | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Already verified (or a link is outstanding) -> reflect that instead of asking again.
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    api.get<Status>("/identity/status", accessToken).then(setStatus).catch(() => {});
  }, [isAuthenticated, accessToken]);

  // While waiting for the user to finish on their phone, poll for the outcome.
  useEffect(() => {
    if (!sent || !accessToken) return;
    timer.current = setInterval(() => {
      api.get<Status>("/identity/status", accessToken).then(setStatus).catch(() => {});
    }, 4000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [sent, accessToken]);

  useEffect(() => {
    if (status?.verified || status?.status === "APPROVED") {
      const t = setTimeout(() => router.push("/dashboard"), 1800);
      return () => clearTimeout(t);
    }
  }, [status, router]);

  async function send() {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<StartResponse>("/identity/start", { phone, consent }, accessToken);
      setSent(res);
      setStatus({ verified: false, status: "PENDING_CAPTURE", reason: null, attemptsLeft: 3 });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't send the text. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const approved = status?.verified || status?.status === "APPROVED";
  const rejected = status?.status === "REJECTED";

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white px-4 py-12">
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-extrabold text-gray-900">Verify your identity</h1>

        {approved ? (
          <p className="mt-4 rounded-lg bg-green-50 p-4 text-green-800">You&apos;re verified. Taking you to your dashboard…</p>
        ) : rejected ? (
          <div className="mt-4 space-y-3">
            <p className="rounded-lg bg-red-50 p-4 text-red-800">
              We couldn&apos;t verify you. {status?.reason ? status.reason.replace(/ \| /g, " ") : ""}
            </p>
            <p className="text-sm text-gray-600">You&apos;ve used all attempts for this link. Request a new one below.</p>
          </div>
        ) : null}

        {!approved && !sent && (
          <div className="mt-4 space-y-5">
            <p className="text-gray-600">
              To keep DateBuk real, we&apos;ll text a secure link to your phone. Open it, scan the front of your
              government ID, and take two quick selfies. We compare your face to your ID photo and confirm you&apos;re a
              live person.
            </p>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Mobile number</span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+14155550123"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none"
              />
              <span className="mt-1 block text-xs text-gray-500">Include your country code, e.g. +1 for the US.</span>
            </label>

            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
              <span>
                I consent to DateBuk processing my ID and face images to verify my identity and age. The images are
                analysed and not stored; only the result is kept.
              </span>
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="button"
              onClick={send}
              disabled={busy || !consent || phone.trim().length < 8}
              className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 py-3 font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Sending…" : "Text me the link"}
            </button>
            <button type="button" onClick={() => router.push("/dashboard")} className="w-full text-sm text-gray-500 underline">
              Do this later
            </button>
          </div>
        )}

        {!approved && sent && (
          <div className="mt-4 space-y-4">
            <p className="rounded-lg bg-purple-50 p-4 text-purple-900">
              {sent.delivery === "queued"
                ? `We're texting a link to the number ending in ${sent.phoneLast4}. It should arrive within a minute and is valid for 30 minutes.`
                : "Text messaging isn't switched on for this server yet (development), so no SMS was sent. The link was written to the API log."}
            </p>
            <p className="text-sm text-gray-600">
              Keep this page open — it updates automatically once you finish on your phone.
              {status?.status === "PROCESSING" && " Checking your photos…"}
            </p>
            {status?.status === "PENDING_CAPTURE" && status.reason && (
              <p className="text-sm text-amber-700">Last attempt: {status.reason.replace(/ \| /g, " ")}</p>
            )}
            <button
              type="button"
              onClick={() => {
                setSent(null);
                setError(null);
              }}
              className="text-sm text-purple-700 underline"
            >
              Use a different number / resend
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
