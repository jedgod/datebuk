import http from "node:http";
import express from "express";
import cors from "cors";
import Redis from "ioredis";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { env } from "./config";
import { router } from "./routes";
import { attachSocket } from "./socket";
import { markExpiredCallsMissed } from "./call-service";

async function main() {
  const app = express();
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "256kb" }));
  app.use("/api", router);

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: env.WEB_ORIGIN, credentials: true }
  });

  const pub = new Redis(env.REDIS_URL);
  const sub = pub.duplicate();
  io.adapter(createAdapter(pub, sub));

  io.on("connection", socket => {
    try {
      attachSocket(io, socket, pub);
    } catch (error) {
      socket.disconnect(true);
    }
  });

  setInterval(() => {
    markExpiredCallsMissed().catch(console.error);
  }, 5000);

  server.listen(env.PORT, () => {
    console.log(`DateBuk final calling API running on :${env.PORT}`);
  });
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
