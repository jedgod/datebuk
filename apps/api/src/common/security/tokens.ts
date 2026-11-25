import { nanoid } from "nanoid";

export function newOpaqueToken(): string {
  // URL-safe, high-entropy token for refresh/verify/reset
  return nanoid(48);
}
