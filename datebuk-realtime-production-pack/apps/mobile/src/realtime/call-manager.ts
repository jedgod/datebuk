import { mediaDevices, RTCPeerConnection, RTCSessionDescription } from "react-native-webrtc";
import { getSocket } from "./socket";

const configuration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302"] },
    {
      urls: [process.env.EXPO_PUBLIC_TURN_URL!],
      username: process.env.EXPO_PUBLIC_TURN_USERNAME!,
      credential: process.env.EXPO_PUBLIC_TURN_PASSWORD!
    }
  ]
};

export class CallManager {
  private peer: RTCPeerConnection | null = null;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async prepareLocalMedia(video: boolean) {
    return mediaDevices.getUserMedia({
      audio: true,
      video: video ? { facingMode: "user" } : false
    });
  }

  async createPeer(peerId: string, callId: string) {
    const socket = getSocket(this.accessToken);
    const peer = new RTCPeerConnection(configuration);
    this.peer = peer;

    peer.addEventListener("icecandidate", (event: any) => {
      if (event.candidate) {
        socket.emit("webrtc:ice", {
          peerId,
          callId,
          data: event.candidate
        });
      }
    });

    return peer;
  }

  async createOffer(peerId: string, callId: string) {
    const socket = getSocket(this.accessToken);
    if (!this.peer) throw new Error("Peer connection not ready");

    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);

    socket.emit("webrtc:offer", { peerId, callId, data: offer });
  }

  async acceptOffer(peerId: string, callId: string, offer: any) {
    const socket = getSocket(this.accessToken);
    if (!this.peer) throw new Error("Peer connection not ready");

    await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(answer);

    socket.emit("webrtc:answer", { peerId, callId, data: answer });
  }

  async applyAnswer(answer: any) {
    if (!this.peer) throw new Error("Peer connection not ready");
    await this.peer.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async addIceCandidate(candidate: any) {
    if (!this.peer) return;
    await this.peer.addIceCandidate(candidate);
  }

  close() {
    this.peer?.close();
    this.peer = null;
  }
}
