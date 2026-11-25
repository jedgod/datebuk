import { io, Socket } from 'socket.io-client';
import { secureStorage } from './secureStorage';

// The real backend chat endpoint (apps/api/src/realtime/chat.gateway.ts) is a
// Socket.IO gateway, not a raw WebSocket server — it speaks Engine.IO framing
// and authenticates via `socket.handshake.auth.token`, room-scoped to a
// matchId via a `chat:join` handshake message. A bare `new WebSocket(url)`
// (the previous implementation here) cannot parse Socket.IO's wire protocol
// at all and also leaked the bearer token in the connection URL — this now
// uses the same socket.io-client the signaling service already relies on,
// with the token passed in the auth payload instead of the URL.
const rawApiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
const SOCKET_URL = String(rawApiUrl).replace(/\/$/, '');

class WebSocketService {
  private socket: Socket | null = null;
  private currentMatchId: string | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  async connect(matchId: string): Promise<void> {
    const token = await secureStorage.getAccessToken();
    if (!token) throw new Error('AUTHENTICATION_REQUIRED');

    this.currentMatchId = matchId;

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => {
      this.socket?.emit('chat:join', { matchId });
    });

    this.socket.on('chat:message', (data: any) => {
      const handler = this.messageHandlers.get('message');
      if (handler) handler(data);
    });

    this.socket.on('chat:typing', (data: any) => {
      const handler = this.messageHandlers.get('typing');
      if (handler) handler(data);
    });

    this.socket.on('chat:error', (data: any) => {
      console.error('Chat gateway error:', data?.message);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
    });
  }

  on(eventType: string, handler: (data: any) => void): void {
    this.messageHandlers.set(eventType, handler);
  }

  off(eventType: string): void {
    this.messageHandlers.delete(eventType);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.currentMatchId = null;
  }

  // Message creation/persistence goes through the REST API (messageService),
  // which already triggers a `chat:message` broadcast to the room server-side
  // (see MessagesController -> ChatGateway.emitMessage) — sending it again
  // here via `chat:send` would create the same message twice.
  sendTyping(isTyping: boolean = true): void {
    if (!this.currentMatchId) return;
    this.socket?.emit('chat:typing', { matchId: this.currentMatchId, isTyping });
  }
}

export default new WebSocketService();
