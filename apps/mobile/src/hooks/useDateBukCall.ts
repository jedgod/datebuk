import { useCallback, useEffect, useRef, useState } from "react";
import {
  mediaDevices,
  MediaStream,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
} from "react-native-webrtc";
import api from "../services/api";
import { socket } from "../services/signaling";

type MediaKind = "voice" | "video";
type Status = "idle" | "ringing" | "connecting" | "connected" | "ended" | "failed";

type TurnCredentialResponse = {
  iceServers: RTCIceServer[];
};

async function fetchIceServers(): Promise<RTCIceServer[]> {
  const response = await api.get<TurnCredentialResponse>("/turn-credentials");
  if (!Array.isArray(response.data.iceServers) || response.data.iceServers.length === 0) {
    throw new Error("TURN_CONFIGURATION_UNAVAILABLE");
  }
  return response.data.iceServers;
}

export function useDateBukCall(selfId: string) {
  const pc = useRef<RTCPeerConnection | null>(null);
  const peerId = useRef("");
  const activeCallId = useRef("");
  const mediaKind = useRef<MediaKind>("video");
  const pendingCandidates = useRef<any[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [muted, setMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const releaseMedia = useCallback(() => {
    pc.current?.close();
    pc.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    pendingCandidates.current = [];
    setLocalStream(null);
    setRemoteStream(null);
  }, []);

  const flushCandidates = useCallback(async (connection: RTCPeerConnection) => {
    const candidates = pendingCandidates.current.splice(0);
    for (const candidate of candidates) {
      await connection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, []);

  const createPeer = useCallback(async () => {
    const connection = new RTCPeerConnection({ iceServers: await fetchIceServers() });

    (connection as any).addEventListener("icecandidate", (event: any) => {
      if (!event.candidate) return;
      socket.emit("webrtc:ice", {
        peerId: peerId.current,
        callId: activeCallId.current,
        candidate: event.candidate,
      });
    });

    (connection as any).addEventListener("track", (event: any) => {
      if (event.streams?.[0]) setRemoteStream(event.streams[0]);
    });

    (connection as any).addEventListener("connectionstatechange", () => {
      if (connection.connectionState === "connected") setStatus("connected");
      if (connection.connectionState === "failed" || connection.connectionState === "closed") {
        setStatus("failed");
      }
      if (connection.connectionState === "disconnected") setStatus("connecting");
    });

    pc.current = connection;
    return connection;
  }, []);

  const getMedia = useCallback(async (media: MediaKind) => {
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: media === "video"
        ? { facingMode: "user", width: 1280, height: 720 }
        : false,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const prepareConnection = useCallback(async (media: MediaKind) => {
    const stream = await getMedia(media);
    const connection = await createPeer();
    stream.getTracks().forEach((track) => connection.addTrack(track, stream));
    return connection;
  }, [createPeer, getMedia]);

  const sendOffer = useCallback(async () => {
    const connection = pc.current;
    if (!connection) throw new Error("CALL_CONNECTION_NOT_READY");
    const offer = await connection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: mediaKind.current === "video",
    });
    await connection.setLocalDescription(offer);
    socket.emit("webrtc:offer", {
      peerId: peerId.current,
      callId: activeCallId.current,
      media: mediaKind.current,
      sdp: offer,
    });
  }, []);

  const startCall = useCallback(async (calleeId: string, callId: string, media: MediaKind) => {
    try {
      setError(null);
      peerId.current = calleeId;
      activeCallId.current = callId;
      mediaKind.current = media;
      setStatus("connecting");
      await prepareConnection(media);
      socket.emit("call:invite", { calleeId, callId, media });
      setStatus("ringing");
    } catch (reason) {
      releaseMedia();
      setError(reason instanceof Error ? reason.message : "Unable to start call");
      setStatus("failed");
    }
  }, [prepareConnection, releaseMedia]);

  const prepareIncoming = useCallback((callerId: string, callId: string, media: MediaKind) => {
    peerId.current = callerId;
    activeCallId.current = callId;
    mediaKind.current = media;
    setStatus("ringing");
  }, []);

  const acceptCall = useCallback(async (callerId: string, callId: string, media: MediaKind) => {
    try {
      setError(null);
      peerId.current = callerId;
      activeCallId.current = callId;
      mediaKind.current = media;
      setStatus("connecting");
      await prepareConnection(media);
      socket.emit("call:accept", { callId, media });
    } catch (reason) {
      releaseMedia();
      setError(reason instanceof Error ? reason.message : "Unable to accept call");
      setStatus("failed");
    }
  }, [prepareConnection, releaseMedia]);

  const endCall = useCallback((notifyPeer = true) => {
    if (notifyPeer && activeCallId.current) {
      socket.emit("call:end", { callId: activeCallId.current });
    }
    releaseMedia();
    setStatus("ended");
  }, [releaseMedia]);

  useEffect(() => {
    const onAccepted = async (payload: any) => {
      if (payload.callId !== activeCallId.current) return;
      try {
        setStatus("connecting");
        await sendOffer();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to negotiate call");
        endCall();
      }
    };

    const onOffer = async (payload: any) => {
      if (payload.callId !== activeCallId.current || !pc.current) return;
      try {
        await pc.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        await flushCandidates(pc.current);
        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);
        socket.emit("webrtc:answer", {
          peerId: payload.fromUserId,
          callId: payload.callId,
          sdp: answer,
        });
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to accept remote media");
        endCall();
      }
    };

    const onAnswer = async (payload: any) => {
      if (payload.callId !== activeCallId.current || !pc.current) return;
      await pc.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      await flushCandidates(pc.current);
    };

    const onIce = async (payload: any) => {
      if (payload.callId !== activeCallId.current) return;
      if (!pc.current?.remoteDescription) {
        pendingCandidates.current.push(payload.candidate);
        return;
      }
      await pc.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
    };

    const onEnded = (payload: any) => {
      if (!payload?.callId || payload.callId === activeCallId.current) endCall(false);
    };

    socket.on("call:accepted", onAccepted);
    socket.on("call:rejected", onEnded);
    socket.on("call:cancelled", onEnded);
    socket.on("call:ended", onEnded);
    socket.on("webrtc:offer", onOffer);
    socket.on("webrtc:answer", onAnswer);
    socket.on("webrtc:ice", onIce);

    return () => {
      socket.off("call:accepted", onAccepted);
      socket.off("call:rejected", onEnded);
      socket.off("call:cancelled", onEnded);
      socket.off("call:ended", onEnded);
      socket.off("webrtc:offer", onOffer);
      socket.off("webrtc:answer", onAnswer);
      socket.off("webrtc:ice", onIce);
    };
  }, [endCall, flushCandidates, sendOffer]);

  useEffect(() => () => releaseMedia(), [releaseMedia]);

  return {
    localStream,
    remoteStream,
    status,
    muted,
    cameraEnabled,
    error,
    startCall,
    prepareIncoming,
    acceptCall,
    endCall,
    toggleMute() {
      const next = !muted;
      localStreamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = !next;
      });
      setMuted(next);
      socket.emit("call:mute", { callId: activeCallId.current, muted: next });
    },
    toggleCamera() {
      const next = !cameraEnabled;
      localStreamRef.current?.getVideoTracks().forEach((track) => {
        track.enabled = next;
      });
      setCameraEnabled(next);
      socket.emit("call:camera", { callId: activeCallId.current, enabled: next });
    },
    flipCamera() {
      localStreamRef.current?.getVideoTracks().forEach((track: any) => track._switchCamera?.());
    },
  };
}
