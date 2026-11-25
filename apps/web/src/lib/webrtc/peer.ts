import { config } from "@/lib/config";
import { getSocket } from "@/lib/socket";

export type PeerEvents = {
  onRemoteStream?: (stream: MediaStream) => void;
  onStatus?: (status: string) => void;
  onRemoteUserId?: (userId: string) => void;
  onForceEnded?: (reason: string) => void;
};

type TurnCredentialResponse = {
  ttl: number;
  expiresAt: number;
  iceServers: RTCIceServer[];
};

export async function fetchIceServers(accessToken: string): Promise<RTCIceServer[]> {
  const response = await fetch(`${config.apiUrl}/api/turn-credentials`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Unable to obtain TURN credentials: ${response.status}`);
  const result = (await response.json()) as TurnCredentialResponse;
  if (!Array.isArray(result.iceServers) || result.iceServers.length === 0) {
    throw new Error("Invalid ICE-server response");
  }
  return result.iceServers;
}

export async function createWebPeerConnection(accessToken: string): Promise<RTCPeerConnection> {
  return new RTCPeerConnection({
    iceServers: await fetchIceServers(accessToken),
    iceCandidatePoolSize: 10,
  });
}

export async function restartIce(peer: RTCPeerConnection, accessToken: string) {
  peer.setConfiguration({ ...peer.getConfiguration(), iceServers: await fetchIceServers(accessToken) });
  peer.restartIce();
  const offer = await peer.createOffer({ iceRestart: true });
  await peer.setLocalDescription(offer);
  return offer;
}

export async function createPeer(roomId: string, accessToken: string, events: PeerEvents, callToken?: string) {
  const socket = getSocket(accessToken);
  const pc = await createWebPeerConnection(accessToken);
  let localStream: MediaStream | null = null;
  const pendingCandidates: RTCIceCandidateInit[] = [];

  pc.ontrack = (event) => events.onRemoteStream?.(event.streams[0]);
  pc.onicecandidate = (event) => {
    if (event.candidate) socket.emit("ice-candidate", { roomId, candidate: event.candidate });
  };
  const addPendingCandidates = async () => {
    for (const candidate of pendingCandidates.splice(0)) {
      await pc.addIceCandidate(candidate);
    }
  };
  const onOffer = async ({ offer }: any) => {
    await pc.setRemoteDescription(offer);
    await addPendingCandidates();
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("answer", { roomId, answer });
  };
  const onAnswer = async ({ answer }: any) => {
    await pc.setRemoteDescription(answer);
    await addPendingCandidates();
  };
  const onIceCandidate = async ({ candidate }: any) => {
    if (!pc.remoteDescription) {
      pendingCandidates.push(candidate);
      return;
    }
    await pc.addIceCandidate(candidate);
  };
  const onUserJoined = async (payload: { userId?: string } = {}) => {
    if (payload.userId) events.onRemoteUserId?.(payload.userId);
    if (localStream && pc.signalingState === "stable") await makeOffer();
  };
  const onForceEnded = (payload: { reason?: string } = {}) => {
    events.onForceEnded?.(payload.reason || "ENDED");
  };
  socket.on("offer", onOffer);
  socket.on("answer", onAnswer);
  socket.on("ice-candidate", onIceCandidate);
  socket.on("user-joined", onUserJoined);
  socket.on("call:force-ended", onForceEnded);
  pc.onconnectionstatechange = () => events.onStatus?.(`Connection ${pc.connectionState}`);

  async function startLocal(mode: "voice" | "video" = "video") {
    localStream = await navigator.mediaDevices.getUserMedia({ video: mode === "video", audio: true });
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream!));
    return localStream;
  }
  async function makeOffer(iceRestart = false) {
    const offer = iceRestart ? await restartIce(pc, accessToken) : await pc.createOffer();
    if (!iceRestart) await pc.setLocalDescription(offer);
    socket.emit("offer", { roomId, offer });
  }
  // A bare roomId is no longer enough — apps/signaling now requires a signed call-auth
  // token proving the caller is a real, non-blocked, tier-eligible match participant for
  // this specific room (see POST /calls/token and apps/signaling's join-room handler).
  function join() {
    if (!callToken) throw new Error("Missing call authorization token");
    socket.emit("join-room", { roomId, callToken });
  }
  function stop() {
    socket.off("offer", onOffer);
    socket.off("answer", onAnswer);
    socket.off("ice-candidate", onIceCandidate);
    socket.off("user-joined", onUserJoined);
    socket.off("call:force-ended", onForceEnded);
    localStream?.getTracks().forEach((track) => track.stop());
    pc.close();
  }
  return { pc, join, startLocal, makeOffer, stop };
}

export type WebPeer = Awaited<ReturnType<typeof createPeer>>;
