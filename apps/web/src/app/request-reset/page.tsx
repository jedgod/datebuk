"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { TextField } from "@/components/ui/textfield";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RequestResetPage() {
  const [email, setEmail] = useState("demo@datepage.app");
  const [status, setStatus] = useState("");

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 px-6 py-16">
      <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 shadow-soft border border-black/5 space-y-4">
        <h1 className="text-2xl font-extrabold">Forgot password</h1>
        <p className="text-sm text-black/70">Enter your email. If an account exists, we’ll send a reset link.</p>
        <TextField label="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <Button onClick={async ()=>{
          try {
            await api.post("/auth/request-password-reset", { email });
            setStatus("If your account exists, a reset link was sent (check server logs in dev). ✅");
          } catch (e:any) {
            setStatus(e?.message ?? "Request failed");
          }
        }}>Send reset link</Button>
        {status ? <div className="text-sm text-black/80">{status}</div> : null}
        <Link className="text-sm font-semibold underline" href="/login">Back to login</Link>
      </div>
    </main>
  );
}
