import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { authRouter } from './modules/auth/auth.routes';
import { matchRouter } from './modules/matching/match.routes';
import { chatRouter } from './modules/chat/chat.routes';
import { safetyRouter } from './modules/safety/safety.routes';
import { paymentRouter } from './modules/payments/payment.routes';
import { verificationRouter } from './modules/verification/verification.routes';
import { adminRouter } from './modules/admin/admin.routes';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ ok: true, service: 'datebuk-api' }));
app.use('/api/auth', authRouter);
app.use('/api/matches', matchRouter);
app.use('/api/chat', chatRouter);
app.use('/api/safety', safetyRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/admin', adminRouter);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', socket => {
  socket.on('join', ({ userId }) => socket.join(`user:${userId}`));
  socket.on('message:send', payload => {
    io.to(`user:${payload.receiverId}`).emit('message:new', payload);
  });
});

server.listen(process.env.PORT || 5000, () => console.log('DateBuk API running'));
