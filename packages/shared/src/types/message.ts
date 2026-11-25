import type { UUID } from "./user";

export interface Message {
  id: UUID;
  matchId: UUID;
  senderId: UUID;
  content: string;
  createdAt: string;
}
