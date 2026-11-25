import { env } from "./config";

type PushMessage = {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  priority?: "default" | "normal" | "high";
  sound?: "default" | null;
};

export async function sendExpoPush(messages: PushMessage[]) {
  if (messages.length === 0) return;

  const response = await fetch(env.EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(messages)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Expo push failed: ${response.status} ${text}`);
  }
}
