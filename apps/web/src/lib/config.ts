function publicUrl(name: string, value: string | undefined, fallback: string): string {
  const raw = value?.trim() || fallback;
  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`${name} must be an absolute URL`);
  }
}

const apiUrl = publicUrl("NEXT_PUBLIC_API_URL", process.env.NEXT_PUBLIC_API_URL, "http://localhost:4000");

export const config = {
  apiUrl,
  signalingUrl: publicUrl("NEXT_PUBLIC_SIGNALING_URL", process.env.NEXT_PUBLIC_SIGNALING_URL, "http://localhost:4001"),
} as const;

export function apiEndpoint(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const apiPath = normalized.startsWith("/api/") ? normalized : `/api${normalized}`;
  return `${config.apiUrl}${apiPath}`;
}
