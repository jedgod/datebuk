import {
  mediaDevices,
  RTCPeerConnection,
  RTCSessionDescription
} from "react-native-webrtc";
import { io, type Socket } from "socket.io-client";
import { fetchIceServers } from "./turn-client";

export class DateBukCallManager {
  private peer: RTCPeerConnection | null = null;
  private socket: Socket | null = null;

  async connect(accessToken: string) {
    const { iceServers } = await fetchIceServers(accessToken);

    this.socket = io(process.env.EXPO_PUBLIC_SOCKET_URL!, {
      auth: { token: accessToken },
      transports: ["websocket"]
    });

    this.peer = new RTCPeerConnection({ iceServers });
    return { socket: this.socket, peer: this.peer };
  }

  async getLocalStream(video: boolean) {
    return mediaDevices.getUserMedia({
      audio: true,
      video: video ? { facingMode: "user" } : false
    });
  }

  async createOffer(peerId: string, callId: string) {
    if (!this.peer || !this.socket) throw new Error("Call manager not connected");

    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);

    this.socket.emit("webrtc:offer", {
      peerId,
      callId,
      data: offer
    });
  }

  async acceptOffer(peerId: string, callId: string, offer: any) {
    if (!this.peer || !this.socket) throw new Error("Call manager not connected");

    await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(answer);

    this.socket.emit("webrtc:answer", {
      peerId,
      callId,
      data: answer
    });
  }

  async applyAnswer(answer: any) {
    if (!this.peer) throw new Error("Peer not ready");
    await this.peer.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async addIceCandidate(candidate: any) {
    if (!this.peer) return;
    await this.peer.addIceCandidate(candidate);
  }

  close() {
    this.peer?.close();
    this.socket?.disconnect();
    this.peer = null;
    this.socket = null;
  }
}
