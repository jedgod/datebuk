import { createHmac, timingSafeEqual } from "crypto";
import { existsSync, readFileSync } from "fs";
import { createServer } from "http";
import { dirname, resolve } from "path";
import { loadEnvFile } from "process";
import { fileURLToPath } from "url";
import { Server, Socket } from "socket.io";

// This package is "type": "module", so __dirname doesn't exist here — computing it from
// import.meta.url is the ESM equivalent. (Previously this referenced a bare __dirname,
// which threw ReferenceError and was silently swallowed by the catch below, so the
// .env file was never actually loaded outside of an environment that set these vars
// another way.)
const currentDir = dirname(fileURLToPath(import.meta.url));
try { loadEnvFile(resolve(currentDir, "../../api/.env")); } catch { /* production injects environment */ }

type Claims = {
  sub: string; exp: number; iss: string; aud: string | string[];
  // Only present on a call-authorization token minted by apps/api's POST /calls/token —
  // never on a normal access token used to authenticate the socket connection itself.
  purpose?: string; roomId?: string; participants?: string[]; media?: string;
};
type Call = { id: string; callerId: string; calleeId: string; status: string; updatedAt: number };

const JWT_SECRET = process.env.JWT_SECRET || (process.env.JWT_SECRET_FILE && existsSync(process.env.JWT_SECRET_FILE)
  ? readFileSync(process.env.JWT_SECRET_FILE, "utf8").trim()
  : undefined);
if (!JWT_SECRET) throw new Error("JWT_SECRET is required");
// Shared with apps/api (same .env, same variable name) so apps/api can pull active-room
// telemetry from this process over plain HTTP without exposing it publicly.
const INTERNAL_KEY = process.env.SIGNALING_INTERNAL_KEY;
if (!INTERNAL_KEY) throw new Error("SIGNALING_INTERNAL_KEY is required");
const API_URL = (process.env.API_URL || "http://localhost:4000").replace(/\/$/, "").replace(/\/api$/, "");
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.WEB_URL || "http://localhost:3000")
  .split(",").map((origin) => origin.trim()).filter(Boolean);

function verifyToken(token: string): Claims {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("invalid token");
  const expected = createHmac("sha256", JWT_SECRET!).update(`${parts[0]}.${parts[1]}`).digest("base64url");
  const supplied = Buffer.from(parts[2]);
  const expectedBuffer = Buffer.from(expected);
  if (supplied.length !== expectedBuffer.length || !timingSafeEqual(supplied, expectedBuffer)) throw new Error("invalid signature");
  const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as Claims;
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!claims.sub || claims.exp <= Math.floor(Date.now() / 1000) || claims.iss !== "datebuk-api" || !audience.includes("datebuk-calling")) {
    throw new Error("invalid claims");
  }
  return claims;
}

function stringField(value: unknown, max = 256): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function audit(event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ level: "audit", event, at: new Date().toISOString(), ...data }));
}

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"], credentials: true },
  maxHttpBufferSize: 64 * 1024,
});
type RoomStat = { displayName: string; bitrateKbps: number; packetLossPercent: number; rttMs: number; updatedAt: number };

const calls = new Map<string, Call>();
const roomParticipants = new Map<string, Set<string>>();
const roomStartedAt = new Map<string, number>();
const roomStats = new Map<string, Map<string, RoomStat>>();
const rate = new Map<string, { count: number; resetAt: number }>();
const STATS_FRESHNESS_MS = 20_000;

function userId(socket: Socket) { return socket.data.userId as string; }
function accessTier(socket: Socket) { return (socket.data.accessTier as string) || "FREE"; }
function rateAllowed(id: string) {
  const now = Date.now();
  const entry = rate.get(id);
  if (!entry || entry.resetAt <= now) { rate.set(id, { count: 1, resetAt: now + 60_000 }); return true; }
  entry.count += 1;
  return entry.count <= 30;
}
function otherParticipant(call: Call, sender: string) {
  if (call.callerId === sender) return call.calleeId;
  if (call.calleeId === sender) return call.callerId;
  return null;
}
function callError(socket: Socket, code: string) { socket.emit("call:error", { code }); }

// Asks apps/api whether either of these two users has blocked the other. Signaling has
// no database access of its own, so a blocked pair must be stopped here rather than
// relying only on apps/api rejecting the call at a higher layer that this process never
// goes through (join-room is reached directly from the client, not via apps/api).
async function isBlockedPair(userA: string, userB: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${API_URL}/api/internal/safety/blocked?userA=${encodeURIComponent(userA)}&userB=${encodeURIComponent(userB)}`,
      { headers: { "x-internal-key": INTERNAL_KEY! }, signal: AbortSignal.timeout(4000) },
    );
    if (!response.ok) return false; // fail open on infra errors — a block-check outage must not itself take calling down
    const body = await response.json() as { blocked?: boolean };
    return !!body.blocked;
  } catch {
    return false;
  }
}

// A join-room request must present a call-authorization token minted by apps/api's
// POST /calls/token — proof that the sender is a real, non-blocked, tier-eligible
// participant of this specific roomId (a matchId). Without this, join-room previously
// trusted a bare roomId string with no eligibility check at all: any two authenticated
// users who knew/guessed the same string could get into a call together.
function verifyCallToken(token: string, roomId: string, sender: string): Claims | null {
  try {
    const claims = verifyToken(token);
    if (claims.purpose !== "call-auth") return null;
    if (claims.sub !== sender) return null;
    if (claims.roomId !== roomId) return null;
    if (!Array.isArray(claims.participants) || !claims.participants.includes(sender)) return null;
    return claims;
  } catch {
    return null;
  }
}

function findSharedRoom(userA: string, userB: string): string | null {
  for (const [roomId, participants] of roomParticipants) {
    if (participants.has(userA) && participants.has(userB)) return roomId;
  }
  return null;
}

async function forceEndRoom(roomId: string, reason: string) {
  io.to(`call:${roomId}`).emit("call:force-ended", { roomId, reason });
  const sockets = await io.in(`call:${roomId}`).fetchSockets();
  for (const s of sockets) s.leave(`call:${roomId}`);
  roomParticipants.delete(roomId);
  roomStartedAt.delete(roomId);
  roomStats.delete(roomId);
}

function leaveAllRooms(sender: string, socket: Socket) {
  for (const [roomId, participants] of roomParticipants) {
    if (!participants.delete(sender)) continue;
    socket.to(`call:${roomId}`).emit("user-left", { userId: sender });
    if (participants.size === 0) {
      roomParticipants.delete(roomId);
      roomStartedAt.delete(roomId);
      roomStats.delete(roomId);
    }
  }
}

io.use(async (socket, next) => {
  try {
    if (process.env.NODE_ENV === "production" && socket.handshake.headers["x-forwarded-proto"] !== "https") {
      return next(new Error("TLS_REQUIRED"));
    }
    const header = socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");
    const token = String(socket.handshake.auth?.token || header || "");
    if (!token) return next(new Error("AUTHENTICATION_REQUIRED"));
    const claims = verifyToken(token);
    const response = await fetch(`${API_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return next(new Error("INVALID_OR_EXPIRED_TOKEN"));
    const user = await response.json() as { id?: string; accountStatus?: string; accessTier?: string; displayName?: string; email?: string };
    if (user.id !== claims.sub || user.accountStatus !== "ACTIVE") return next(new Error("USER_NOT_ALLOWED"));
    socket.data.userId = claims.sub;
    socket.data.accessTier = user.accessTier || "FREE";
    socket.data.displayName = user.displayName || user.email || "Unknown";
    next();
  } catch { next(new Error("INVALID_OR_EXPIRED_TOKEN")); }
});

io.on("connection", async (socket) => {
  const sender = userId(socket);
  await socket.join(`user:${sender}`);
  socket.emit("socket:authenticated", { userId: sender });

  socket.on("join-room", async (payload: unknown) => {
    if (!rateAllowed(sender)) return callError(socket, "INVALID_SIGNALING_PAYLOAD");
    const { roomId, callToken } = (payload && typeof payload === "object" ? payload : {}) as { roomId?: unknown; callToken?: unknown };
    // callToken is a signed JWT (roomId + both participant ids + media + standard
    // claims) — comfortably past the 256-char default used for other string fields here.
    if (!stringField(roomId) || !stringField(callToken, 4096)) return callError(socket, "INVALID_SIGNALING_PAYLOAD");

    const claims = verifyCallToken(callToken, roomId, sender);
    if (!claims) return callError(socket, "CALL_ACCESS_DENIED");

    const otherId = claims.participants!.find((p) => p !== sender);
    if (otherId && (await isBlockedPair(sender, otherId))) return callError(socket, "CALL_ACCESS_DENIED");

    const participants = roomParticipants.get(roomId) || new Set<string>();
    // Membership is now bounded by the token's own participant list, not just a bare
    // count cap — a third person can never join even if the first two haven't left yet.
    if (!participants.has(sender) && (participants.size >= 2 || !claims.participants!.includes(sender))) {
      return callError(socket, "CALL_ACCESS_DENIED");
    }
    participants.add(sender); roomParticipants.set(roomId, participants);
    if (!roomStartedAt.has(roomId)) roomStartedAt.set(roomId, Date.now());
    await socket.join(`call:${roomId}`);
    socket.to(`call:${roomId}`).emit("user-joined", { userId: sender });
  });

  socket.on("call:stats", (payload: any) => {
    if (!payload || !stringField(payload.roomId) || !roomParticipants.get(payload.roomId)?.has(sender) || !rateAllowed(sender)) {
      return;
    }
    const bitrateKbps = Number(payload.bitrateKbps);
    const packetLossPercent = Number(payload.packetLossPercent);
    const rttMs = Number(payload.rttMs);
    if (![bitrateKbps, packetLossPercent, rttMs].every((n) => Number.isFinite(n) && n >= 0)) return;
    const participants = roomStats.get(payload.roomId) || new Map<string, RoomStat>();
    participants.set(sender, {
      displayName: (socket.data.displayName as string) || "Unknown",
      bitrateKbps: Math.min(bitrateKbps, 100_000),
      packetLossPercent: Math.min(packetLossPercent, 100),
      rttMs: Math.min(rttMs, 60_000),
      updatedAt: Date.now(),
    });
    roomStats.set(payload.roomId, participants);
  });

  for (const event of ["offer", "answer", "ice-candidate"] as const) {
    socket.on(event, (payload: any) => {
      if (!payload || !stringField(payload.roomId) || !roomParticipants.get(payload.roomId)?.has(sender) || !rateAllowed(sender)) {
        return callError(socket, "INVALID_SIGNALING_PAYLOAD");
      }
      const key = event === "ice-candidate" ? "candidate" : event;
      if (payload[key] == null) return callError(socket, "INVALID_SIGNALING_PAYLOAD");
      socket.to(`call:${payload.roomId}`).emit(event, { [key]: payload[key], fromUserId: sender });
    });
  }

  socket.on("call:invite", async (payload: any) => {
    if (!payload || !stringField(payload.callId) || !stringField(payload.calleeId) || !["voice", "video"].includes(payload.media)) {
      return callError(socket, "INVALID_SIGNALING_PAYLOAD");
    }
    // Mirrors apps/web's subscription-access-policy.ts: voice requires Premium or Elite,
    // video requires Elite. The UI already hides these options by tier, but that alone
    // never stopped a client from emitting "call:invite" directly over the socket, so it
    // has to be enforced here too, against the tier verified server-side at connection time.
    const tier = accessTier(socket);
    if (tier === "FREE") return callError(socket, "SUBSCRIPTION_REQUIRED");
    if (payload.media === "video" && tier !== "ELITE") return callError(socket, "SUBSCRIPTION_REQUIRED");
    if (!rateAllowed(sender) || [...calls.values()].some((call) => call.status !== "ended" && [call.callerId, call.calleeId].includes(sender))) {
      return callError(socket, "CALL_LIMIT_REACHED");
    }
    // Previously missing entirely on this path — a blocked user could still ring the
    // person who blocked them via call:invite (mobile's real calling flow), even though
    // join-room (web's flow) already checked this.
    if (await isBlockedPair(sender, payload.calleeId)) return callError(socket, "CALL_ACCESS_DENIED");

    const call = { id: payload.callId, callerId: sender, calleeId: payload.calleeId, status: "ringing", updatedAt: Date.now() };
    calls.set(call.id, call);
    io.to(`user:${call.calleeId}`).emit("call:incoming", { callId: call.id, callerId: sender, media: payload.media });
    audit("call_created", { callId: call.id, callerId: sender, calleeId: call.calleeId });
  });

  const relayCall = (event: string, output: string) => socket.on(event, (payload: any) => {
    if (!payload || !stringField(payload.callId) || !rateAllowed(sender)) return callError(socket, "INVALID_SIGNALING_PAYLOAD");
    const call = calls.get(payload.callId); const peer = call && otherParticipant(call, sender);
    if (!call || !peer) return callError(socket, "CALL_ACCESS_DENIED");
    call.status = event.split(":")[1] || event; call.updatedAt = Date.now();
    io.to(`user:${peer}`).emit(output, { callId: call.id, fromUserId: sender, media: payload.media });
    audit(event.replace(":", "_"), { callId: call.id, userId: sender });
  });
  relayCall("call:accept", "call:accepted"); relayCall("call:reject", "call:rejected");
  relayCall("call:cancel", "call:cancelled"); relayCall("call:end", "call:ended");
  relayCall("call:mute", "call:mute"); relayCall("call:camera", "call:camera");

  for (const [event, output, dataKey] of [["webrtc:offer", "webrtc:offer", "sdp"], ["webrtc:answer", "webrtc:answer", "sdp"], ["webrtc:ice", "webrtc:ice", "candidate"]] as const) {
    socket.on(event, (payload: any) => {
      if (!payload || !stringField(payload.callId) || payload[dataKey] == null || !rateAllowed(sender)) return callError(socket, "INVALID_SIGNALING_PAYLOAD");
      const call = calls.get(payload.callId); const peer = call && otherParticipant(call, sender);
      if (!call || !peer || (payload.peerId && payload.peerId !== peer)) return callError(socket, "CALL_ACCESS_DENIED");
      io.to(`user:${peer}`).emit(output, { callId: call.id, fromUserId: sender, [dataKey]: payload[dataKey], media: payload.media });
    });
  }

  socket.on("disconnect", () => {
    // Previously a no-op beyond logging, which left roomParticipants (and this join-room
    // block-check's view of "who's already in this room") accumulating stale/ghost
    // entries forever after every disconnect — cleaning up here keeps both room state
    // and the safety checks above accurate.
    leaveAllRooms(sender, socket);
    audit("socket_disconnected", { userId: sender });
  });
});

setInterval(() => {
  const stale = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, call] of calls) if (call.updatedAt < stale) calls.delete(id);

  // roomParticipants has no leave/disconnect cleanup today (a pre-existing gap, not
  // addressed here), so roomStats/roomStartedAt must self-prune on report freshness
  // rather than room membership, or they'd grow unbounded for the lifetime of the process.
  const statsStale = Date.now() - STATS_FRESHNESS_MS;
  for (const [roomId, participants] of roomStats) {
    for (const [uid, stat] of participants) if (stat.updatedAt < statsStale) participants.delete(uid);
    if (participants.size === 0) { roomStats.delete(roomId); roomStartedAt.delete(roomId); }
  }
}, 60_000).unref();

// Internal-only endpoint for apps/api to poll live call-quality telemetry for staff
// tooling. Socket.IO only intercepts requests under its own `path` (default
// /socket.io/), so a plain listener on the same httpServer for any other path is safe.
httpServer.on("request", (req, res) => {
  if (req.method === "GET" && req.url === "/internal/active-rooms") {
    if (!internalKeyOk(req)) return unauthorized(res);
    const now = Date.now();
    const rooms = [];
    for (const [roomId, participants] of roomStats) {
      const fresh = [...participants.values()].filter((p) => now - p.updatedAt <= STATS_FRESHNESS_MS);
      if (fresh.length === 0) continue;
      rooms.push({
        roomId,
        startedAt: roomStartedAt.get(roomId) || now,
        participants: fresh.map((p) => ({
          displayName: p.displayName,
          bitrateKbps: p.bitrateKbps,
          packetLossPercent: p.packetLossPercent,
          rttMs: p.rttMs,
        })),
      });
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ rooms }));
    return;
  }

  // Called by apps/api (SafetyService) right after a block is created, so an
  // already-in-progress call between the two users ends immediately rather than only
  // being prevented on the next join-room attempt.
  if (req.method === "POST" && req.url === "/internal/force-end-room") {
    if (!internalKeyOk(req)) return unauthorized(res);
    let body = "";
    req.on("data", (chunk) => { body += chunk; if (body.length > 4096) req.destroy(); });
    req.on("end", async () => {
      try {
        const { userA, userB, reason } = JSON.parse(body || "{}");
        if (!stringField(userA) || !stringField(userB)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "userA and userB are required" }));
        }
        const roomId = findSharedRoom(userA, userB);
        if (roomId) await forceEndRoom(roomId, typeof reason === "string" ? reason : "FORCE_ENDED");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ended: !!roomId }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "invalid body" }));
      }
    });
    return;
  }
});

function internalKeyOk(req: import("http").IncomingMessage): boolean {
  const provided = Buffer.from(String(req.headers["x-internal-key"] || ""));
  const expected = Buffer.from(INTERNAL_KEY!);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

function unauthorized(res: import("http").ServerResponse) {
  res.writeHead(401, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "unauthorized" }));
}

const PORT = Number(process.env.SIGNALING_PORT) || 4001;
httpServer.listen(PORT, () => console.log(`Authenticated signaling server running on port ${PORT}`));
