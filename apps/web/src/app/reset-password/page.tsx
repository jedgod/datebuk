"use client";

export const dynamic = "force-dynamic";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { TextField } from "@/components/ui/textfield";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params?.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<string>("");

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 px-6 py-16">
      <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 shadow-soft border border-black/5 space-y-4">
        <h1 className="text-2xl font-extrabold">Reset password</h1>
        <p className="text-sm text-black/70">If your token is valid, you can set a new password.</p>
        <TextField label="New password" type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} />
        <Button onClick={async ()=>{
          try {
            await api.post("/auth/reset-password", { token, newPassword });
            setStatus("Password updated ✅ Redirecting to login…");
            setTimeout(()=>router.push("/login"), 900);
          } catch (e:any) {
            setStatus(e?.message ?? "Reset failed");
          }
        }}>Reset</Button>
        {status ? <div className="text-sm text-black/80">{status}</div> : null}
      </div>
    </main>
  );
}
