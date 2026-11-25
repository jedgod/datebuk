import cors from "cors";
import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();
const PORT = 3002;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    name: "DateBuk Support Chat API", 
    version: "1.0.0",
    port: PORT,
    endpoints: [
      "GET /health",
      "POST /chat/sessions",
      "GET /chat/sessions/:id/messages",
      "POST /chat/sessions/:id/messages",
      "POST /chat/sessions/:id/close",
      "GET /chat/sessions/active"
    ]
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "support-chat-api", port: PORT });
});

// ============= CHAT ENDPOINTS =============

// Create new chat session
app.post("/chat/sessions", async (req, res) => {
  try {
    const { userEmail, userName } = req.body;

    const session = await prisma.chatSession.create({
      data: {
        userEmail,
        userName: userName || "Guest",
        status: "active",
      },
    });

    console.log(`[Chat] Session created: ${session.id} for ${userName || userEmail || "Guest"}`);

    res.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("[Chat] Error creating session:", error);
    console.error("[Chat] Error details:", error instanceof Error ? error.message : String(error));
    res.status(500).json({ 
      error: "Failed to create chat session",
      details: error instanceof Error ? error.message : undefined
    });
  }
});

// Get chat messages for a session
app.get("/chat/sessions/:sessionId/messages", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
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

// Send a message in a chat session
app.post("/chat/sessions/:sessionId/messages", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { sender, message, senderEmail } = req.body;

    if (!sender || !message) {
      res.status(400).json({ error: "sender and message are required" });
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

    console.log(`[Chat] Message sent in session ${sessionId}: ${message.substring(0, 50)}...`);

    // Send auto-response for user messages
    if (sender === "user") {
      setTimeout(async () => {
        await prisma.chatMessage.create({
          data: {
            sessionId,
            sender: "support",
            message: "Thanks for your message! A support agent will be with you shortly.",
            senderEmail: "support@datebuk.com",
          },
        });
        console.log(`[Chat] Auto-response sent for session ${sessionId}`);
      }, 2000);
    }

    res.json({
      success: true,
      message: chatMessage,
    });
  } catch (error) {
    console.error("[Chat] Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Close a chat session (staff only)
app.post("/chat/sessions/:sessionId/close", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: "closed",
        closedAt: new Date(),
      },
    });

    console.log(`[Chat] Session closed: ${sessionId}`);

    res.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("[Chat] Error closing session:", error);
    res.status(500).json({ error: "Failed to close session" });
  }
});

// Get all active chat sessions (staff only)
app.get("/chat/sessions/active", async (req, res) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
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

// Start server
app.listen(PORT, '127.0.0.1', async () => {
  console.log(`\n✅ Support Chat API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health\n`);
  
  // Test database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');
    // Skip count for now to avoid startup error
    // const count = await prisma.chatSession.count();
    // console.log(`📊 Current chat sessions in database: ${count}\n`);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
  }
});
