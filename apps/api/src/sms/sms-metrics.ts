/**
 * Process-local sliding-window counters for signals that have no business being rows in the
 * database (e.g. rejected webhook requests - an attacker must not be able to make us write a row
 * per probe). Like the existing permission-denial counter in SecurityAlertService, this resets on
 * restart and is for alerting, never for access control. Holds counts only: no payloads, no secrets.
 */
const events = new Map<string, number[]>();
const MAX_KEPT = 5_000;

export const smsMetrics = {
  inc(name: string, now = Date.now()) {
    const arr = events.get(name) ?? [];
    arr.push(now);
    if (arr.length > MAX_KEPT) arr.splice(0, arr.length - MAX_KEPT);
    events.set(name, arr);
  },
  count(name: string, windowMs: number, now = Date.now()) {
    const arr = events.get(name);
    if (!arr) return 0;
    const from = now - windowMs;
    // drop what can never matter again (keep 1h)
    while (arr.length && arr[0] < now - 3_600_000) arr.shift();
    return arr.reduce((n, t) => (t >= from ? n + 1 : n), 0);
  },
  reset() {
    events.clear();
  },
};
