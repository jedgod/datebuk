import { apiEndpoint } from "./config";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function request<T>(path: string, method: HttpMethod, body?: unknown, token?: string): Promise<T> {
  const makeRequest = async (targetPath: string) =>
    fetch(apiEndpoint(targetPath), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      // Lets the httpOnly refresh-token cookie flow to/from the API origin.
      credentials: "include",
    });

  const res = await makeRequest(path);

  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;

  if (!res.ok) {
    const msg = (data && typeof data === "object" && "message" in data) ? (data as any).message : `Request failed (${res.status})`;
    throw new ApiError(res.status, String(msg), data);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, token?: string) => request<T>(path, "GET", undefined, token),
  post: <T>(path: string, body?: unknown, token?: string) => request<T>(path, "POST", body, token),
  put:  <T>(path: string, body?: unknown, token?: string) => request<T>(path, "PUT", body, token),
  patch:<T>(path: string, body?: unknown, token?: string) => request<T>(path, "PATCH", body, token),
  del:  <T>(path: string, token?: string) => request<T>(path, "DELETE", undefined, token),
};

// Admin API helpers for security dashboard
export const adminApi = {
  // Fraud Events
  getFraudEvents: (token?: string, params?: any) => api.get("/admin/fraud/events", token),
  getFraudStats: (token?: string) => api.get("/admin/fraud/stats", token),
  getFraudEventById: (id: string, token?: string) => api.get(`/admin/fraud/events/${id}`, token),
  provideFraudFeedback: (id: string, feedback: string, notes?: string, token?: string) =>
    api.post(`/admin/fraud/events/${id}/feedback`, { feedback, notes }, token),

  // IP Management
  addIpToBlacklist: (ip: string, reason: string, severity: number, token?: string) =>
    api.post("/admin/fraud/blacklist/add", { ip, reason, severity }, token),
  checkIpBlacklist: (ip: string, token?: string) => api.get(`/admin/fraud/blacklist/check/${ip}`, token),
  removeIpFromBlacklist: (ip: string, token?: string) =>
    api.post("/admin/fraud/blacklist/remove", { ip }, token),
  getBlacklistedIps: (token?: string) => api.get("/admin/fraud/blacklist/list", token),
  getIpEvents: (ip: string, token?: string) => api.get(`/admin/fraud/ip/${ip}/events`, token),

  // Moderator Queue
  getModeratorQueue: (token?: string) => api.get("/admin/moderator/queue", token),
  getQueueStats: (token?: string) => api.get("/admin/moderator/queue/stats", token),
  assignQueueItem: (itemId: string, moderatorId: string, token?: string) =>
    api.post(`/admin/moderator/queue/${itemId}/assign`, { moderatorId }, token),
  reviewQueueItem: (itemId: string, decision: "approved" | "rejected", notes?: string, token?: string) =>
    api.post(`/admin/moderator/queue/${itemId}/review`, { decision, notes }, token),
  escalateQueueItem: (itemId: string, token?: string) =>
    api.post(`/admin/moderator/queue/${itemId}/escalate`, {}, token),

  // Experiments (A/B Testing)
  createExperiment: (name: string, variants: string[], duration: number, token?: string) =>
    api.post("/admin/experiment/create", { name, variants, duration }, token),
  getExperimentVariant: (experimentId: string, token?: string) =>
    api.get(`/admin/experiment/variant/${experimentId}`, token),
  getExperimentResults: (experimentId: string, token?: string) =>
    api.get(`/admin/experiment/results/${experimentId}`, token),
  listExperiments: (token?: string) => api.get("/admin/experiment/list", token),
  endExperiment: (experimentId: string, token?: string) =>
    api.post(`/admin/experiment/end/${experimentId}`, {}, token),

  // User Management
  getUserEvents: (userId: string, token?: string) =>
    api.get(`/admin/fraud/user/${userId}/events`, token),

  // Video Moderation Queue (with pagination)
  getVideoQueue: (params?: {
    status?: string;
    severity?: string;
    minRiskScore?: number;
    isLive?: boolean;
    page?: number;
    limit?: number;
  }, token?: string) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.severity) queryParams.set('severity', params.severity);
    if (params?.minRiskScore !== undefined) queryParams.set('minRiskScore', String(params.minRiskScore));
    if (params?.isLive !== undefined) queryParams.set('isLive', String(params.isLive));
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    
    const query = queryParams.toString();
    return api.get(`/admin/video-moderation/queue${query ? '?' + query : ''}`, token);
  },

  // Alias for recommended naming
  getFlaggedVideos: (params?: {
    status?: string;
    severity?: string;
    minRiskScore?: number;
    isLive?: boolean;
    page?: number;
    limit?: number;
  }, token?: string) => adminApi.getVideoQueue(params, token),

  // Video moderation actions
  reviewVideoItem: (itemId: string, decision: "approved" | "flagged" | "escalated", token?: string) =>
    api.post(`/admin/video-moderation/queue/${itemId}/review`, { decision }, token),

  getVideoModerationMetrics: (token?: string) =>
    api.get("/admin/video-moderation/metrics", token),
};
