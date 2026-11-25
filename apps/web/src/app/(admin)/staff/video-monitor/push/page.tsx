"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/textfield";
import { staffVideoMonitorApi } from "@/lib/staff-video-monitor-api";

export default function StaffVideoMonitorPushPage() {
  const [title, setTitle] = useState("DateBuk");
  const [body, setBody] = useState("Hello from staff video monitor!");
  const [url, setUrl] = useState("/messages");
  const [gender, setGender] = useState("");
  const [interest, setInterest] = useState("");
  const [emailVerified, setEmailVerified] = useState("");
  const [status, setStatus] = useState("");

  async function send() {
    try {
      const segment: any = {};
      if (gender) segment.gender = gender;
      if (interest) segment.interest = interest;
      if (emailVerified === "true") segment.emailVerified = true;
      if (emailVerified === "false") segment.emailVerified = false;

      const res = await staffVideoMonitorApi.post<{ count: number }>("/push/broadcast", {
        segment,
        payload: { title, body, url },
      });

      setStatus(`Broadcast job enqueued ✅ Count=${(res as any).count ?? "?"}`);
    } catch (e: any) {
      setStatus(e?.message ?? "Failed");
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Staff • Video Monitor — Push</h1>
      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-soft space-y-3">
        <div className="grid md:grid-cols-3 gap-3">
          <TextField label="Title" value={title} onChange={(e)=>setTitle(e.target.value)} />
          <TextField label="URL" value={url} onChange={(e)=>setUrl(e.target.value)} />
          <TextField label="Gender segment (optional)" value={gender} onChange={(e)=>setGender(e.target.value)} placeholder="e.g. female" />
        </div>
        <TextField label="Body" value={body} onChange={(e)=>setBody(e.target.value)} />
        <div className="grid md:grid-cols-2 gap-3">
          <TextField label="Interest segment (optional)" value={interest} onChange={(e)=>setInterest(e.target.value)} placeholder="e.g. hiking" />
          <TextField label="Email verified (true/false optional)" value={emailVerified} onChange={(e)=>setEmailVerified(e.target.value)} placeholder="true" />
        </div>
        <Button onClick={send}>Send broadcast</Button>
        {status ? <div className="text-sm text-black/70">{status}</div> : null}
        <div className="text-xs text-black/50">Requires staff access.</div>
      </div>
    </div>
  );
}
