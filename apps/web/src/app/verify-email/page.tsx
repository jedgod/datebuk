"use client";

export const dynamic = "force-dynamic";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const token = params?.get("token");
  const [status, setStatus] = useState("Verifying…");

  useEffect(() => {
    (async () => {
      if (!token) return setStatus("Missing token.");
      try {
        await api.post("/auth/verify-email", { token });
        setStatus("Email verified ✅");
      } catch (e: any) {
        setStatus(e?.message ?? "Verification failed");
      }
    })();
  }, [token]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 px-6 py-16">
      <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 shadow-soft border border-black/5">
        <h1 className="text-2xl font-extrabold">Verify email</h1>
        <p className="mt-3 text-sm text-black/70">{status}</p>
        <Link className="mt-6 inline-block text-sm font-semibold underline" href="/login">Go to login</Link>
      </div>
    </main>
  );
}
