import type { UUID } from "./user";

export interface Like {
  id: UUID;
  fromId: UUID;
  toId: UUID;
  createdAt: string;
}

export interface Match {
  id: UUID;
  user1Id: UUID;
  user2Id: UUID;
  createdAt: string;
}
