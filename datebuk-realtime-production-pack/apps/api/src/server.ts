import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import { env } from "./config";
import { router } from "./routes";
import { registerSocketHandlers } from "./socket";

async function main() {
  const app = express();
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use("/api", router);

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: env.WEB_ORIGIN, credentials: true },
    transports: ["websocket", "polling"]
  });

  const pubClient = new Redis(env.REDIS_URL);
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  io.use((socket, next) => {
    try {
      registerSocketHandlers(io, socket, pubClient);
      next();
    } catch (error) {
      next(error instanceof Error ? error : new Error("Socket authentication failed"));
    }
  });

  server.listen(env.PORT, () => {
    console.log(`DateBuk realtime API listening on :${env.PORT}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
