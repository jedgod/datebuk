import { io, Socket } from 'socket.io-client';
const URL = process.env.EXPO_PUBLIC_SIGNALING_URL || 'http://10.0.2.2:4000';
export const socket: Socket = io(URL, { autoConnect: false, transports: ['websocket'] });
export function connectSignaling(userId: string) {
  if (!socket.connected) socket.connect();
  socket.emit('register-user', { userId });
}
