import api from './api';
import { Message } from '../types';

export const messageService = {
  async getMessages(matchId: string): Promise<Message[]> {
    const response = await api.get<Message[]>(`/messages/${matchId}`);
    return response.data;
  },

  async sendMessage(matchId: string, content: string): Promise<Message> {
    const response = await api.post<Message>(`/messages/${matchId}`, { content });
    return response.data;
  },

  async markAsRead(messageId: string): Promise<void> {
    await api.patch(`/messages/${messageId}/read`);
  },
};
