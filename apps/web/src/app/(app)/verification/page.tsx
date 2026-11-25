"use client";

import { useEffect, useRef, useState } from "react";
import { Shield, CheckCircle2, Camera, AlertCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/stores/auth";
import { api } from "@/lib/api";

type Step = "loading" | "intro" | "camera" | "preview" | "uploading" | "pending" | "approved" | "rejected";

interface UploadPresignResponse {
  url: string;
  key: string;
}

export default function VerificationPage() {
  const { accessToken } = useAuth();
  const [step, setStep] = useState<Step>("loading");
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load current verification status on mount.
  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const status = await api.get<{ verified: boolean; status: string; rejectionReason: string | null }>(
          "/verification/status",
          accessToken
        );
        if (status.verified) setStep("approved");
        else if (status.status === "PENDING") setStep("pending");
        else if (status.status === "REJECTED") {
          setRejectionReason(status.rejectionReason);
          setStep("rejected");
        } else setStep("intro");
      } catch (err) {
        console.error("Failed to load verification status:", err);
        setStep("intro");
      }
    })();
  }, [accessToken]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => stopCamera, []);

  const startCamera = async () => {
    setError(null);
    let timedOut = false;
    try {
      // getUserMedia can sit unresolved indefinitely in some browser/permission-prompt
      // states rather than cleanly rejecting — without a bound, the UI would stay on
      // this screen forever with no feedback that anything went wrong. A timeout turns
      // that into an actionable message instead of a silent hang.
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => {
          timedOut = true;
          reject(new Error("timeout"));
        }, 12000)
      );
      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }).then((s) => {
          // The permission prompt resolved after we'd already given up and shown an
          // error — release the camera immediately instead of leaving it granted and
          // unused in the background.
          if (timedOut) {
            s.getTracks().forEach((t) => t.stop());
            return null;
          }
          return s;
        }),
        timeout,
      ]);
      if (!stream) return;
      streamRef.current = stream;
      setStep("camera");
      // Video element mounts on next render; attach once available.
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch (err) {
      setError(
        err instanceof Error && err.message === "timeout"
          ? "Camera didn't respond. Check your browser's camera permission for this site and try again."
          : "Camera access was denied. Please allow camera access to verify your identity."
      );
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        stopCamera();
        setStep("preview");
      },
      "image/jpeg",
      0.9
    );
  };

  const retake = () => {
    setCapturedBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    startCamera();
  };

  const submitPhoto = async () => {
    if (!capturedBlob || !accessToken) return;
    setStep("uploading");
    setError(null);
    try {
      const presign = await api.post<UploadPresignResponse>(
        "/uploads/presign",
        { contentType: "image/jpeg", kind: "image", fileName: "verification.jpg", sizeBytes: capturedBlob.size },
        accessToken
      );

      const putRes = await fetch(presign.url, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: capturedBlob,
      });
      if (!putRes.ok) throw new Error("Failed to upload photo");

      await api.post("/uploads/complete", { key: presign.key }, accessToken);
      await api.post("/verification/submit", { photoKey: presign.key, consent: consented }, accessToken);

      setStep("pending");
    } catch (err) {
      console.error("Verification submission failed:", err);
      setError("Failed to submit your photo. Please try again.");
      setStep("preview");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {step === "loading" && (
        <div className="text-center py-12">
          <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto" />
        </div>
      )}

      {step === "intro" && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Photo Verification</h1>
            <p className="text-gray-600 mt-2">
              Confirm your selfie matches your profile photos to unlock video dates and build trust
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold">How it works:</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold">1</span>
                </div>
                <div>
                  <p className="font-semibold">Take a clear selfie</p>
                  <p className="text-sm text-gray-600">Good lighting, face clearly visible, no filters</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <div>
                  <p className="font-semibold">Our safety team reviews it</p>
                  <p className="text-sm text-gray-600">
                    A real person checks it matches your profile photos — usually within 24 hours
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <p className="font-semibold">Get your photo-verified badge</p>
                  <p className="text-sm text-gray-600">Unlock video dates and show you're authentic</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Privacy Protected:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Your photo is only visible to our safety review team</li>
                  <li>Never shown on your public profile</li>
                </ul>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={consented}
              onChange={(e) => setConsented(e.target.checked)}
              className="mt-1"
            />
            <span>
              I consent to my photo being reviewed by the safety team for photo verification purposes.
            </span>
          </label>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <Button onClick={startCamera} disabled={!consented} className="w-full h-14 text-lg">
            <Camera className="w-5 h-5 mr-2" />
            Start Verification
          </Button>
        </div>
      )}

      {step === "camera" && (
        <div className="space-y-6">
          <div className="aspect-video bg-black rounded-2xl relative overflow-hidden">
            <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
          </div>
          <p className="text-center text-gray-600">Make sure your face is clearly visible and well-lit</p>
          <Button onClick={capturePhoto} className="w-full h-14 text-lg">
            <Camera className="w-5 h-5 mr-2" />
            Capture Photo
          </Button>
        </div>
      )}

      {step === "preview" && previewUrl && (
        <div className="space-y-6">
          <div className="aspect-video bg-black rounded-2xl relative overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Captured selfie preview" className="w-full h-full object-cover" />
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <div className="flex gap-3">
            <Button onClick={retake} variant="outline" className="flex-1 h-14 text-lg">
              Retake
            </Button>
            <Button onClick={submitPhoto} className="flex-1 h-14 text-lg">
              Submit for Review
            </Button>
          </div>
        </div>
      )}

      {step === "uploading" && (
        <div className="text-center py-12">
          <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
          <h2 className="text-2xl font-bold mt-6">Submitting…</h2>
        </div>
      )}

      {step === "pending" && (
        <div className="text-center py-12 space-y-6">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-14 h-14 text-blue-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-blue-600">Under Review</h2>
            <p className="text-gray-600 mt-2 text-lg">
              Your photo has been submitted. Our safety team typically reviews within 24 hours.
            </p>
          </div>
        </div>
      )}

      {step === "rejected" && (
        <div className="text-center py-12 space-y-6">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-14 h-14 text-red-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-red-600">Not Approved</h2>
            <p className="text-gray-600 mt-2 text-lg">{rejectionReason || "Your submission didn't meet our verification requirements."}</p>
          </div>
          <Button onClick={() => { setConsented(false); setStep("intro"); }} className="mt-4">
            Try Again
          </Button>
        </div>
      )}

      {step === "approved" && (
        <div className="text-center py-12 space-y-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-14 h-14 text-green-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-green-600">Verified! 🎉</h2>
            <p className="text-gray-600 mt-2 text-lg">You can now start video dates with your matches</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 inline-block">
            <div className="flex items-center gap-2 text-green-900">
              <Shield className="w-5 h-5" />
              <span className="font-semibold">Photo-Verified Badge Unlocked</span>
            </div>
          </div>

          <Button onClick={() => (window.location.href = "/matches")} className="mt-8">
            Start Video Dating
          </Button>
        </div>
      )}
    </div>
  );
}
