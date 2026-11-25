export function safeJson<T>(value: unknown, fallback: T): T {
  try {
    return value as T;
  } catch {
    return fallback;
  }
}
