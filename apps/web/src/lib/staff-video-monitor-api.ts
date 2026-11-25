import { ApiError } from "@/lib/api";

type HttpMethod = "GET" | "POST";

const BASE_PATH = "/api/staff/video-monitor";

async function request<T>(path: string, method: HttpMethod, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_PATH}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    credentials: "include",
  });

  const text = await res.text();
  const data = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      })()
    : null;

  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? (data as any).message
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, String(msg), data);
  }

  return data as T;
}

export const staffVideoMonitorApi = {
  get: <T>(path: string) => request<T>(path, "GET"),
  post: <T>(path: string, body?: unknown) => request<T>(path, "POST", body),
};
