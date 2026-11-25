// WebRTC state and connection hooks
import { useCallback, useEffect, useRef, useState } from "react";
import { createPeer, type WebPeer } from "@/lib/webrtc/peer";
import { useAuth } from "@/stores/auth";
import { getSocket } from "@/lib/socket";

export interface WebRTCState {
  status: "initializing" | "connecting" | "connected" | "failed" | "ended";
  isAudioMuted: boolean;
  isVideoOff: boolean;
  timeElapsed: number;
  connectionQuality: "excellent" | "good" | "fair" | "poor";
}

export function useVideoDate(roomId: string, mode: "voice" | "video" = "video", callToken?: string) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const accessToken = useAuth((state) => state.accessToken);
  const [peer, setPeer] = useState<WebPeer | null>(null);
  const [state, setState] = useState<WebRTCState>({
    status: "initializing",
    isAudioMuted: false,
    isVideoOff: false,
    timeElapsed: 0,
    connectionQuality: "good",
  });
  const [userame, setUsername] = useState("");
  const [remoteUsername, setRemoteUsername] = useState("");
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize peer connection
  useEffect(() => {
    if (!accessToken || !callToken) {
      setError(!accessToken ? null : "Missing call authorization. Start the call from your match instead of a direct link.");
      setState((prev) => ({ ...prev, status: "failed" }));
      return;
    }
    let disposed = false;
    let activePeer: WebPeer | null = null;
    void createPeer(roomId, accessToken, {
      onRemoteStream: (stream) => {
        if (remoteRef.current) {
          remoteRef.current.srcObject = stream;
          setState((prev) => ({ ...prev, status: "connected" }));
        }
      },
      onStatus: (statusMsg) => {
        if (statusMsg.includes("connected") || statusMsg.includes("Connected")) {
          setState((prev) => ({ ...prev, status: "connected" }));
        } else if (statusMsg.includes("failed") || statusMsg.includes("Failed")) {
          setState((prev) => ({ ...prev, status: "failed" }));
        }
      },
      // The real identity of the other participant, learned the moment they join the
      // signaling room — this is the only reliable source of it on this page, since
      // roomId itself carries no match/user reference.
      onRemoteUserId: (userId) => setRemoteUserId(userId),
      onForceEnded: (reason) => {
        setError(reason === "BLOCKED" ? "This call has ended." : "The call was ended.");
        setState((prev) => ({ ...prev, status: "ended" }));
      },
    }, callToken).then(async (p) => {
      if (disposed) return p.stop();
      activePeer = p;
      setPeer(p);
      try {
        p.join();
        const local = await p.startLocal(mode);
        if (localRef.current) localRef.current.srcObject = local;
        setState((prev) => ({ ...prev, status: "connecting" }));
      } catch (error) {
        setError(error instanceof Error ? error.message : "Camera or microphone access failed");
        setState((prev) => ({ ...prev, status: "failed" }));
      }
    }).catch((reason) => {
      setError(reason instanceof Error ? reason.message : "Unable to initialize the call");
      setState((prev) => ({ ...prev, status: "failed" }));
    });

    return () => { disposed = true; activePeer?.stop(); };
  }, [roomId, mode, accessToken, callToken]);

  // Timer
  useEffect(() => {
    if (state.status !== "connected") return;
    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        timeElapsed: prev.timeElapsed + 1,
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [state.status]);

  const toggleMute = useCallback(() => {
    if (localRef.current?.srcObject) {
      const tracks = (localRef.current.srcObject as MediaStream).getAudioTracks();
      tracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setState((prev) => ({ ...prev, isAudioMuted: !prev.isAudioMuted }));
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localRef.current?.srcObject) {
      const tracks = (localRef.current.srcObject as MediaStream).getVideoTracks();
      tracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setState((prev) => ({ ...prev, isVideoOff: !prev.isVideoOff }));
    }
  }, []);

  const makeOffer = useCallback(() => {
    peer?.makeOffer();
  }, [peer]);

  const endCall = useCallback(() => {
    peer?.stop();
    setPeer(null);
    setState((prev) => ({ ...prev, status: "ended" }));
  }, [peer]);

  const measuredQuality = useConnectionQuality(peer, roomId);
  useEffect(() => {
    setState((prev) => prev.connectionQuality === measuredQuality
      ? prev
      : { ...prev, connectionQuality: measuredQuality });
  }, [measuredQuality]);

  return {
    localRef,
    remoteRef,
    peer,
    state,
    error,
    username: userame,
    remoteUsername,
    remoteUserId,
    setUsername,
    setRemoteUsername,
    toggleMute,
    toggleVideo,
    makeOffer,
    endCall,
  };
}

// Connection quality detector. When roomId is provided, also reports the same
// measurements to the signaling server (see the call:stats handler in
// apps/signaling/src/index.ts) so staff tooling has real call-quality telemetry instead
// of an empty state. Reporting is best-effort: a dropped sample never affects the call.
export function useConnectionQuality(peer: WebPeer | null, roomId?: string) {
  const [quality, setQuality] = useState<WebRTCState["connectionQuality"]>("good");
  const prevBytesRef = useRef<{ bytes: number; at: number } | null>(null);

  useEffect(() => {
    if (!peer) return;
    prevBytesRef.current = null;

    const interval = setInterval(async () => {
      const stats = await peer.pc.getStats();
      let packetsLost = 0;
      let packetsReceived = 0;
      let roundTripTime = 0;
      let bytesReceived = 0;
      stats.forEach((report) => {
        if (report.type === "inbound-rtp" && !report.isRemote) {
          packetsLost += Number(report.packetsLost || 0);
          packetsReceived += Number(report.packetsReceived || 0);
          bytesReceived += Number(report.bytesReceived || 0);
        }
        if (report.type === "remote-inbound-rtp") {
          roundTripTime = Math.max(roundTripTime, Number(report.roundTripTime || 0));
        }
      });
      const totalPackets = packetsLost + packetsReceived;
      const lossRate = totalPackets > 0 ? packetsLost / totalPackets : 0;
      if (roundTripTime > 0.6 || lossRate > 0.12) setQuality("poor");
      else if (roundTripTime > 0.35 || lossRate > 0.06) setQuality("fair");
      else if (roundTripTime > 0.18 || lossRate > 0.02) setQuality("good");
      else setQuality("excellent");

      if (!roomId) return;
      const now = Date.now();
      const prev = prevBytesRef.current;
      const bitrateKbps = prev && now > prev.at ? Math.max(0, ((bytesReceived - prev.bytes) * 8) / (now - prev.at)) : 0;
      prevBytesRef.current = { bytes: bytesReceived, at: now };
      try {
        getSocket().emit("call:stats", {
          roomId,
          bitrateKbps: Math.round(bitrateKbps),
          packetLossPercent: Math.round(lossRate * 1000) / 10,
          rttMs: Math.round(roundTripTime * 1000),
        });
      } catch {
        // Not authenticated yet or socket unavailable — skip this sample.
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [peer, roomId]);

  return quality;
}
