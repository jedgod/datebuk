"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiEndpoint } from "@/lib/config";

type Info = { status: string; challenge: "TURN_HEAD" | "SMILE"; attemptsLeft: number };
type Result = { status: string; approved: boolean; reasons: string[]; canRetry: boolean; attemptsLeft?: number };
type Slot = "idFront" | "selfie" | "selfieChallenge";

const PROMPT: Record<Info["challenge"], string> = {
  TURN_HEAD: "Turn your head to one side, then take the photo.",
  SMILE: "Give a big smile, then take the photo.",
};

function Picker({
  slot,
  title,
  hint,
  capture,
  file,
  preview,
  onPick,
}: {
  slot: Slot;
  title: string;
  hint: string;
  capture: "user" | "environment";
  file?: File;
  preview?: string;
  onPick: (slot: Slot, file: File) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="mb-3 text-sm text-gray-600">{hint}</p>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={title} className="mb-3 h-40 w-full rounded-lg object-cover" />
      )}
      <label className="block cursor-pointer rounded-lg bg-purple-600 py-2 text-center font-semibold text-white">
        {file ? "Retake" : "Open camera"}
        <input
          type="file"
          accept="image/*"
          capture={capture}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(slot, f);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

// Opened from the SMS link (usually on the user's phone). Public page: the one-time token in
// the URL is the credential. Images go straight to the API, which analyses and discards them.
export default function VerifyIdCapturePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const [info, setInfo] = useState<Info | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [files, setFiles] = useState<Partial<Record<Slot, File>>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(apiEndpoint(`/identity/capture/${encodeURIComponent(token)}`), { cache: "no-store" });
      if (!res.ok) throw new Error(res.status === 404 ? "This link isn't valid." : "Couldn't load this page.");
      setInfo(await res.json());
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Couldn't load this page.");
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const previews = useMemo(() => {
    const out: Partial<Record<Slot, string>> = {};
    (Object.keys(files) as Slot[]).forEach((k) => {
      const f = files[k];
      if (f) out[k] = URL.createObjectURL(f);
    });
    return out;
  }, [files]);
  useEffect(() => () => Object.values(previews).forEach((u) => u && URL.revokeObjectURL(u)), [previews]);

  const pick = (slot: Slot, f: File) => setFiles((prev) => ({ ...prev, [slot]: f }));

  async function submit() {
    if (!token || !files.idFront || !files.selfie || !files.selfieChallenge) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("idFront", files.idFront);
      form.append("selfie", files.selfie);
      form.append("selfieChallenge", files.selfieChallenge);
      const res = await fetch(apiEndpoint(`/identity/capture/${encodeURIComponent(token)}/submit`), {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "We couldn't process your photos. Please try again.");
      setResult(data as Result);
      if ((data as Result).canRetry) {
        setFiles({});
        await load(); // a retry gets a fresh challenge
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const done = result && !result.canRetry;
  const inactive = info && info.status !== "PENDING_CAPTURE";

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white px-4 py-8">
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-2xl font-extrabold text-gray-900">Verify your identity</h1>

        {loadError && <p className="rounded-lg bg-red-50 p-4 text-red-800">{loadError}</p>}

        {!loadError && !info && <p className="text-gray-500">Loading…</p>}

        {inactive && !done && (
          <p className="rounded-lg bg-amber-50 p-4 text-amber-900">
            {info!.status === "APPROVED"
              ? "You're already verified. You can close this page."
              : "This link has expired or was already used. Go back to DateBuk and request a new text."}
          </p>
        )}

        {done && (
          <div className={`rounded-lg p-4 ${result!.approved ? "bg-green-50 text-green-900" : "bg-red-50 text-red-900"}`}>
            <p className="font-semibold">{result!.approved ? "You're verified!" : "We couldn't verify you."}</p>
            {result!.approved ? (
              <p className="mt-1 text-sm">You can close this page and return to DateBuk.</p>
            ) : (
              <ul className="mt-2 list-disc pl-5 text-sm">
                {result!.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {info && info.status === "PENDING_CAPTURE" && !done && (
          <>
            {result && !result.approved && (
              <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">That didn&apos;t pass. {result.attemptsLeft ?? info.attemptsLeft} attempt(s) left.</p>
                <ul className="mt-1 list-disc pl-5">
                  {result.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-sm text-gray-600">
              Three quick photos: the front of your government ID, then two selfies. Use good lighting and take off
              sunglasses or a hat.
            </p>

            <Picker slot="idFront" title="1. Front of your ID" hint="Driver's licence, passport card or national ID. Fit the whole card in view, no glare." capture="environment" file={files.idFront} preview={previews.idFront} onPick={pick} />
            <Picker slot="selfie" title="2. Selfie — look straight at the camera" hint="Face centred, eyes open, neutral expression." capture="user" file={files.selfie} preview={previews.selfie} onPick={pick} />
            <Picker slot="selfieChallenge" title="3. Selfie — liveness check" hint={PROMPT[info.challenge]} capture="user" file={files.selfieChallenge} preview={previews.selfieChallenge} onPick={pick} />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="button"
              onClick={submit}
              disabled={busy || !files.idFront || !files.selfie || !files.selfieChallenge}
              className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 py-3 font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Checking…" : "Submit for verification"}
            </button>
            <p className="text-xs text-gray-500">
              Your photos are analysed to compare your face to your ID and confirm you&apos;re a live person, then
              discarded. Only the pass/fail result is kept.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
