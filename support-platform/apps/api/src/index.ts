import cors from "cors";
import express, { Request, Response } from "express";
import http from "http";
import { randomUUID } from "crypto";
import { WebSocketServer, WebSocket } from "ws";
import { PrismaClient } from "@prisma/client";
import { verifyToken, isStaff, isAdmin, TokenPayload } from "./auth";
import { realtimeEmitter } from "./realtime";

const prisma = new PrismaClient();

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

type Ticket = {
  id: string;
  customer: string;
  email?: string; // Email address for public submissions
  status: "Pending" | "In Progress" | "Resolved";
  priority: "High" | "Medium" | "Low";
  age: string;
  notes: string[];
  priorityNote?: string;
  assignedTo?: string;
};

type SupportAction =
  | { action: "create"; ticket: Partial<Ticket> }
  | { action: "start_chat"; ticketId: string }
  | { action: "resolve"; ticketId: string }
  | { action: "transfer"; ticketId: string; assignedTo: string }
  | { action: "add_note"; ticketId: string; note: string }
  | { action: "priority_note"; ticketId: string; note: string };

const PORT = Number(process.env.PORT || 4500);
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/support/ws" });

const tickets: Ticket[] = [];
const sseClients = new Set<Response>();

// Initialize realtime emitter with WebSocket server and SSE clients
realtimeEmitter.initialize(wss, sseClients);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

// Auth middleware
function authMiddleware(req: Request, res: Response, next: () => void) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = header.replace("Bearer ", "");
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.user = payload;
  next();
}

// Staff-only middleware
function requireStaff(req: Request, res: Response, next: () => void) {
  authMiddleware(req, res, () => {
    if (!isStaff(req.user)) {
      res.status(403).json({ error: "Forbidden: staff access required" });
      return;
    }
    next();
  });
}

// Admin-only middleware
function requireAdmin(req: Request, res: Response, next: () => void) {
  authMiddleware(req, res, () => {
    if (!isAdmin(req.user)) {
      res.status(403).json({ error: "Forbidden: admin access required" });
      return;
    }
    next();
  });
}

function normalizeTicket(input: Partial<Ticket>): Ticket {
  return {
    id: input.id || randomUUID(),
    customer: input.customer || "New User",
    email: input.email, // Include email if provided (for public submissions)
    status: input.status || "Pending",
    priority: input.priority || "Medium",
    age: input.age || "Just now",
    notes: input.notes || [],
    priorityNote: input.priorityNote,
    assignedTo: input.assignedTo,
  };
}

function broadcast(event: string, payload: unknown) {
  const message = JSON.stringify({ event, payload });

  sseClients.forEach((client) => {
    client.write(`event: ${event}\n`);
    client.write(`data: ${message}\n\n`);
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// ============= TICKET ENDPOINTS WITH REAL-TIME UPDATES =============

// Public endpoint for contact form submissions (no auth required)
app.post("/support/public-tickets", (req, res) => {
  try {
    const body = req.body || {};
    
    // Validate required fields for public submissions
    if (!body.ticket || !body.ticket.customer || !body.ticket.email) {
      res.status(400).json({ error: "Missing required fields: customer and email" });
      return;
    }

    const ticket = normalizeTicket({
      ...body.ticket,
      status: "Pending",
      // Mark as public submission
      notes: [
        ...(body.ticket.notes || []),
        `[Public Submission] - From contact form`,
      ],
    });
    
    tickets.unshift(ticket);

    // 🔴 Emit real-time notification to staff
    realtimeEmitter.emitReportCreated(ticket);
    broadcast("ticket.created", ticket);
    
    console.log(`[Public Ticket] Created ticket ${ticket.id} from ${ticket.customer} (${ticket.email})`);
    
    res.status(201).json({ 
      success: true,
      ticket: {
        id: ticket.id,
        status: ticket.status,
      },
    });
  } catch (error) {
    console.error("[Public Ticket] Error:", error);
    res.status(500).json({ error: "Failed to create ticket" });
  }
});

app.get("/support/requests", requireStaff, (req, res) => {
  res.json(tickets);
});

app.post("/support/requests", requireStaff, (req, res) => {
  const body = req.body || {};
  const ticket = normalizeTicket(body.ticket ?? body);
  tickets.unshift(ticket);

  // 🔴 Emit real-time notification
  realtimeEmitter.emitReportCreated(ticket);
  broadcast("ticket.created", ticket);
  
  res.status(201).json(ticket);
});

app.patch("/support/requests", requireStaff, (req, res) => {
  const action = req.body as SupportAction;
  const ticketId = "ticketId" in action ? action.ticketId : undefined;

  if (!ticketId && action.action !== "create") {
    res.status(400).json({ error: "ticketId required" });
    return;
  }

  if (action.action === "create") {
    const ticket = normalizeTicket(action.ticket);
    tickets.unshift(ticket);
    // 🔴 Emit real-time notification
    realtimeEmitter.emitReportCreated(ticket);
    broadcast("ticket.created", ticket);
    res.status(201).json(ticket);
    return;
  }

  const ticket = tickets.find((item) => item.id === ticketId);
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  switch (action.action) {
    case "start_chat":
      ticket.status = "In Progress";
      // 📝 Emit status update
      realtimeEmitter.emitReportUpdated(ticketId, { status: ticket.status });
      break;
    case "resolve":
      ticket.status = "Resolved";
      // ✅ Emit status update
      realtimeEmitter.emitReportUpdated(ticketId, { status: ticket.status });
      break;
    case "transfer":
      ticket.assignedTo = action.assignedTo;
      // 👤 Emit assignment event
      realtimeEmitter.emitReportAssigned(ticketId, action.assignedTo);
      break;
    case "add_note":
      ticket.notes.push(action.note);
      // 📝 Emit update
      realtimeEmitter.emitReportUpdated(ticketId, { notes: ticket.notes });
      break;
    case "priority_note":
      ticket.priorityNote = action.note;
      // 📝 Emit update
      realtimeEmitter.emitReportUpdated(ticketId, { priorityNote: action.note });
      break;
  }

  broadcast("ticket.updated", ticket);
  res.json(ticket);
});

app.get("/support/stream", requireStaff, (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  res.write(`event: connected\n`);
  res.write(`data: {"event":"connected"}\n\n`);

  sseClients.add(res);

  req.on("close", () => {
    sseClients.delete(res);
  });
});

// Admin endpoint for token generation (dev/test only, move to auth service in prod)
app.post("/auth/token", requireAdmin, (req, res) => {
  const { userId, role } = req.body as { userId: string; role?: string };
  if (!userId) {
    res.status(400).json({ error: "userId required" });
    return;
  }

  const { generateToken } = require("./auth");
  const token = generateToken(userId, role || "staff");
  res.json({ token });
});

// ============= STAFF STATUS ENDPOINTS =============

// Staff login - mark as online
app.post("/staff/login", requireStaff, (req, res) => {
  const staffId = req.user?.id;
  if (!staffId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // 👤 Emit staff online status
  realtimeEmitter.staffOnline(staffId);
  
  res.json({ 
    status: "online", 
    staffId,
    onlineStaff: realtimeEmitter.getOnlineStaff(),
    timestamp: new Date()
  });
});

// Staff logout - mark as offline
app.post("/staff/logout", requireStaff, (req, res) => {
  const staffId = req.user?.id;
  if (!staffId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // 👤 Emit staff offline status
  realtimeEmitter.staffOffline(staffId);
  
  res.json({ 
    status: "offline", 
    staffId,
    onlineStaff: realtimeEmitter.getOnlineStaff(),
    timestamp: new Date()
  });
});

// Get online staff members
app.get("/staff/online", requireStaff, (req, res) => {
  res.json({
    onlineStaff: realtimeEmitter.getOnlineStaff(),
    staffList: realtimeEmitter.getStaffList(),
    count: realtimeEmitter.getOnlineStaff().length,
  });
});

// ============= SETTINGS ENDPOINTS =============

// Broadcast settings update
app.post("/admin/settings/broadcast", requireAdmin, (req, res) => {
  const { settings, category } = req.body;
  const adminId = req.user?.id;

  if (!settings || !adminId) {
    res.status(400).json({ error: "settings and authorization required" });
    return;
  }

  if (category) {
    // 📢 Broadcast specific category settings
    realtimeEmitter.broadcastSettingCategory(category, settings, adminId);
  } else {
    // 📢 Broadcast all settings
    realtimeEmitter.broadcastSettings(settings, adminId);
  }

  res.json({ 
    message: "Settings broadcasted",
    category: category || "all",
    timestamp: new Date()
  });
});

// ============= CALL METRICS ENDPOINTS =============

// Stream call metrics
app.post("/calls/:callId/metrics", requireStaff, (req, res) => {
  const { callId } = req.params;
  const { metrics } = req.body;

  if (!callId || !metrics) {
    res.status(400).json({ error: "callId and metrics required" });
    return;
  }

  // 📊 Stream call metrics to all clients
  realtimeEmitter.updateCallMetrics(callId, metrics);

  // ⚠️ Alert if quality is poor
  if (metrics.quality === "poor" || metrics.latency > 200) {
    realtimeEmitter.alertCallQualityIssue(callId, metrics.quality || "poor");
  }

  res.json({ 
    callId, 
    message: "Metrics streamed",
    timestamp: new Date()
  });
});

// ============= CHAT ENDPOINTS =============

// Start a new chat session (public endpoint)
app.post("/chat/sessions", async (req, res) => {
  try {
    const { userEmail, userName } = req.body;

    const session = await prisma.chatSession.create({
      data: {
        userEmail,
        userName,
        status: "active",
      },
    });

    // 📢 Notify staff of new chat session
    realtimeEmitter.emitChatSessionStarted(session.id, userEmail, userName);

    res.status(201).json({ 
      success: true,
      session: {
        id: session.id,
        status: session.status,
      }
    });
  } catch (error) {
    console.error("[Chat] Error creating session:", error);
    res.status(500).json({ error: "Failed to create chat session" });
  }
});

// Get chat history for a session
app.get("/chat/sessions/:sessionId/messages", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ 
      success: true,
      messages,
    });
  } catch (error) {
    console.error("[Chat] Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Send a chat message (public endpoint)
app.post("/chat/sessions/:sessionId/messages", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { sender, message, senderEmail } = req.body;

    if (!sender || !message) {
      res.status(400).json({ error: "sender and message required" });
      return;
    }

    const chatMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        sender,
        message,
        senderEmail,
      },
    });

    // 📢 Broadcast message to all connected clients
    realtimeEmitter.emitChatMessage(sessionId, chatMessage);

    res.status(201).json({ 
      success: true,
      message: chatMessage,
    });
  } catch (error) {
    console.error("[Chat] Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Close a chat session (staff only)
app.post("/chat/sessions/:sessionId/close", requireStaff, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: "closed",
        closedAt: new Date(),
        staffId: req.user?.id,
      },
    });

    // 📢 Notify all clients that session is closed
    realtimeEmitter.emitChatSessionClosed(sessionId);

    res.json({ 
      success: true,
      session,
    });
  } catch (error) {
    console.error("[Chat] Error closing session:", error);
    res.status(500).json({ error: "Failed to close session" });
  }
});

// Get active chat sessions (staff only)
app.get("/chat/sessions/active", requireStaff, async (req, res) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { status: "active" },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ 
      success: true,
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    console.error("[Chat] Error fetching sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// ============= WEBSOCKET HANDLER =============

wss.on("connection", (socket, req) => {
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const token = url.searchParams.get("token");

  if (!token) {
    socket.close(1008, "Missing token");
    return;
  }

  const payload = verifyToken(token);
  if (!payload || !isStaff(payload)) {
    socket.close(1008, "Invalid token or insufficient permissions");
    return;
  }

  // 👤 Mark staff as online when connected
  realtimeEmitter.staffOnline(payload.id);

  socket.send(JSON.stringify({ event: "connected", payload: true }));

  socket.on("message", (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      if (!parsed || typeof parsed !== "object") return;
      if (parsed.action) {
        const action = parsed as SupportAction;
        if (action.action === "create") {
          const ticket = normalizeTicket(action.ticket);
          tickets.unshift(ticket);
          // 🔴 Emit real-time notification
          realtimeEmitter.emitReportCreated(ticket);
          broadcast("ticket.created", ticket);
          return;
        }

        const ticketId = "ticketId" in action ? action.ticketId : undefined;
        if (!ticketId) return;

        const ticket = tickets.find((item) => item.id === ticketId);
        if (!ticket) return;

        switch (action.action) {
          case "start_chat":
            ticket.status = "In Progress";
            realtimeEmitter.emitReportUpdated(ticketId, { status: ticket.status });
            break;
          case "resolve":
            ticket.status = "Resolved";
            realtimeEmitter.emitReportUpdated(ticketId, { status: ticket.status });
            break;
          case "transfer":
            ticket.assignedTo = action.assignedTo;
            realtimeEmitter.emitReportAssigned(ticketId, action.assignedTo);
            break;
          case "add_note":
            ticket.notes.push(action.note);
            realtimeEmitter.emitReportUpdated(ticketId, { notes: ticket.notes });
            break;
          case "priority_note":
            ticket.priorityNote = action.note;
            realtimeEmitter.emitReportUpdated(ticketId, { priorityNote: action.note });
            break;
        }

        broadcast("ticket.updated", ticket);
      }
    } catch {
      // Ignore malformed messages.
    }
  });

  socket.on("close", () => {
    // 👤 Mark staff as offline when disconnected
    realtimeEmitter.staffOffline(payload.id);
  });
});

server.listen(PORT, () => {
  console.log(
    `Support platform API listening on http://localhost:${PORT}`,
    `WebSocket: ws://localhost:${PORT}/support/ws`
  );
  console.log(`[Realtime] Real-time features enabled ✅`);
});

