import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'node:http';
import { Server } from 'socket.io';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || '*' },
  transports: ['websocket', 'polling']
});

const userSockets = new Map();
const pushTokens = new Map();

app.get('/health', (_req, res) => res.json({ ok: true, service: 'datebuk-call-signaling' }));
app.post('/push/register', (req, res) => {
  const { userId, token } = req.body ?? {};
  if (!userId || !token) return res.status(400).json({ error: 'userId and token are required' });
  pushTokens.set(userId, token);
  res.status(204).end();
});

io.on('connection', socket => {
  socket.on('register-user', ({ userId }) => {
    if (!userId) return;
    userSockets.set(userId, socket.id);
    socket.data.userId = userId;
    socket.join(`user:${userId}`);
  });

  socket.on('call:invite', payload => {
    const { calleeId, callerId, callId, media } = payload;
    io.to(`user:${calleeId}`).emit('call:incoming', { callerId, callId, media });
    socket.join(`call:${callId}`);
  });

  socket.on('call:accept', payload => {
    socket.join(`call:${payload.callId}`);
    io.to(`user:${payload.callerId}`).emit('call:accepted', payload);
  });

  socket.on('call:reject', payload => io.to(`user:${payload.callerId}`).emit('call:rejected', payload));
  socket.on('webrtc:offer', payload => io.to(`user:${payload.to}`).emit('webrtc:offer', payload));
  socket.on('webrtc:answer', payload => io.to(`user:${payload.to}`).emit('webrtc:answer', payload));
  socket.on('webrtc:ice', payload => io.to(`user:${payload.to}`).emit('webrtc:ice', payload));
  socket.on('call:end', payload => io.to(`user:${payload.to}`).emit('call:ended', payload));

  socket.on('disconnect', () => {
    if (socket.data.userId) userSockets.delete(socket.data.userId);
  });
});

const port = Number(process.env.PORT || 4000);
server.listen(port, '0.0.0.0', () => console.log(`DateBuk signaling server on :${port}`));
