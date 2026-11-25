import { Injectable, Logger } from "@nestjs/common";
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../database/prisma.service";
import { MessagesService } from "../messages/messages.service";

interface AuthedSocketData {
  userId: string;
  email: string;
}

const RATE_LIMIT_MAX_EVENTS = 60;
const RATE_LIMIT_WINDOW_MS = 10_000;

@Injectable()
@WebSocketGateway({
  cors: { origin: process.env.WEB_URL || "http://localhost:3000", credentials: true },
})
export class ChatGateway implements OnGatewayInit, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);
  @WebSocketServer() server!: Server;

  // socketId -> recent event timestamps, for a simple sliding-window rate limit
  private readonly eventTimestamps = new Map<string, number[]>();
  // socketId -> set of matchIds the socket has been verified to join
  private readonly joinedMatches = new Map<string, Set<string>>();

  constructor(
    private messages: MessagesService,
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  afterInit(server: Server) {
    server.use(async (socket: Socket, next: (err?: Error) => void) => {
      try {
        const token = this.extractToken(socket);
        if (!token) {
          next(new Error("Unauthorized: missing token"));
          return;
        }

        const payload = await this.jwt.verifyAsync<{ sub: string; email: string }>(token);
        (socket.data as AuthedSocketData).userId = payload.sub;
        (socket.data as AuthedSocketData).email = payload.email;
        next();
      } catch {
        next(new Error("Unauthorized: invalid or expired token"));
      }
    });
  }

  handleDisconnect(socket: Socket) {
    this.eventTimestamps.delete(socket.id);
    this.joinedMatches.delete(socket.id);
  }

  private extractToken(socket: Socket): string | null {
    const authToken = (socket.handshake.auth as Record<string, unknown> | undefined)?.token;
    if (typeof authToken === "string" && authToken) return authToken;

    const header = socket.handshake.headers?.authorization;
    if (typeof header === "string" && header.startsWith("Bearer ")) {
      return header.slice("Bearer ".length);
    }
    return null;
  }

  private checkRateLimit(socket: Socket): boolean {
    const now = Date.now();
    const timestamps = (this.eventTimestamps.get(socket.id) ?? []).filter(
      (t) => now - t < RATE_LIMIT_WINDOW_MS,
    );
    timestamps.push(now);
    this.eventTimestamps.set(socket.id, timestamps);
    return timestamps.length <= RATE_LIMIT_MAX_EVENTS;
  }

  private async isMatchParticipant(matchId: string, userId: string): Promise<boolean> {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    return !!match && (match.user1Id === userId || match.user2Id === userId);
  }

  @SubscribeMessage("chat:join")
  async join(@MessageBody() body: { matchId: string }, @ConnectedSocket() socket: Socket) {
    const userId = (socket.data as AuthedSocketData).userId;
    if (!userId || !this.checkRateLimit(socket)) return;

    const matchId = body?.matchId;
    if (!matchId || !(await this.isMatchParticipant(matchId, userId))) {
      socket.emit("chat:error", { message: "Not authorized to join this match" });
      return;
    }

    socket.join(matchId);
    const joined = this.joinedMatches.get(socket.id) ?? new Set<string>();
    joined.add(matchId);
    this.joinedMatches.set(socket.id, joined);

    socket.emit("chat:joined", { matchId });
  }

  @SubscribeMessage("chat:typing")
  typing(
    @MessageBody() body: { matchId: string; isTyping: boolean },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = (socket.data as AuthedSocketData).userId;
    if (!userId || !this.checkRateLimit(socket)) return;

    const matchId = body?.matchId;
    if (!matchId || !this.joinedMatches.get(socket.id)?.has(matchId)) return;

    socket.to(matchId).emit("chat:typing", { matchId, userId, isTyping: !!body.isTyping });
  }

  @SubscribeMessage("chat:send")
  async send(
    @MessageBody()
    body: {
      matchId: string;
      content: string;
      attachments?: { key: string; url: string; contentType: string; name?: string; size?: number }[];
    },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = (socket.data as AuthedSocketData).userId;
    if (!userId) {
      socket.emit("chat:error", { message: "Not authenticated" });
      return;
    }
    if (!this.checkRateLimit(socket)) {
      socket.emit("chat:error", { message: "Rate limit exceeded" });
      return;
    }

    const matchId = body?.matchId;
    if (!matchId || !this.joinedMatches.get(socket.id)?.has(matchId)) {
      socket.emit("chat:error", { message: "Join the match before sending messages" });
      return;
    }

    try {
      const msg = await this.messages.create(matchId, userId, body.content, body.attachments);
      this.server.to(matchId).emit("chat:message", { ...msg, matchId });
      socket.emit("chat:sent", { ok: true, messageId: msg.id });
    } catch (error: any) {
      socket.emit("chat:error", { message: error?.message ?? "Failed to send message" });
    }
  }

  emitMessage(matchId: string, msg: any) {
    this.server.to(matchId).emit("chat:message", { ...msg, matchId });
  }

  emitRead(matchId: string, payload: { matchId: string; readerId: string }) {
    this.server.to(matchId).emit("chat:read", payload);
  }
}
