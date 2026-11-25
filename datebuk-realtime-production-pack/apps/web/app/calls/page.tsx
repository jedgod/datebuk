"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export default function CallsPage() {
  const [status, setStatus] = useState("Ready");
  const [calleeId, setCalleeId] = useState("");
  const [token, setToken] = useState("");
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => () => socketRef.current?.disconnect(), []);

  async function start(video: boolean) {
    if (!token || !calleeId) {
      setStatus("Enter an access token and user ID");
      return;
    }

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: { token }
    });
    socketRef.current = socket;

    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: process.env.NEXT_PUBLIC_TURN_URL!,
          username: process.env.NEXT_PUBLIC_TURN_USERNAME!,
          credential: process.env.NEXT_PUBLIC_TURN_PASSWORD!
        }
      ]
    });
    peerRef.current = peer;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video
    });
    if (localVideo.current) localVideo.current.srcObject = stream;
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.ontrack = (event) => {
      if (remoteVideo.current) remoteVideo.current.srcObject = event.streams[0];
    };

    socket.emit("call:start", { calleeId, type: video ? "VIDEO" : "VOICE" }, async (result: any) => {
      if (!result.ok) return setStatus(result.error);
      const callId = result.data.callId;

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc:ice", {
            peerId: calleeId,
            callId,
            data: event.candidate
          });
        }
      };

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit("webrtc:offer", { peerId: calleeId, callId, data: offer });
      setStatus("Calling…");
    });
  }

  return (
    <main style={{ maxWidth: 980, margin: "40px auto", fontFamily: "Arial" }}>
      <h1>DateBuk Calls</h1>
      <p>{status}</p>

      <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        <input placeholder="JWT access token" value={token} onChange={(e) => setToken(e.target.value)} />
        <input placeholder="Callee user ID" value={calleeId} onChange={(e) => setCalleeId(e.target.value)} />
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => start(false)}>Start voice call</button>
          <button onClick={() => start(true)}>Start video call</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <video ref={localVideo} autoPlay muted playsInline style={{ width: "100%", background: "#111" }} />
        <video ref={remoteVideo} autoPlay playsInline style={{ width: "100%", background: "#111" }} />
      </div>
    </main>
  );
}
