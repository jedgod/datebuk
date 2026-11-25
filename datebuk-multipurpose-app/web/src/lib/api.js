const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const ACCESS_TOKEN_KEY = 'dbk_access_token';
const ACTOR_ID_KEY = 'dbk_actor_id';
const ACTOR_ROLE_KEY = 'dbk_actor_role';

function getToken() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) || '';
}

function getActorHeaders() {
  const token = getToken();
  if (token) {
    return {};
  }

  if (typeof window === 'undefined') {
    return {
      'x-actor-id': 'admin.console',
      'x-role': 'admin',
    };
  }

  return {
    'x-actor-id': window.localStorage.getItem('dbk_actor_id') || 'admin.console',
    'x-role': window.localStorage.getItem('dbk_actor_role') || 'admin',
  };
}

function getAuthHeaders() {
  const token = getToken();
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}

function withQuery(path, query) {
  if (!query || typeof query !== 'object' || Object.keys(query).length === 0) return path;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...getActorHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function issueDevToken(role, actorId = '') {
  const payload = await request('/api/auth/dev-token', {
    method: 'POST',
    body: JSON.stringify({ role, actorId }),
  });

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, payload.token);
    window.localStorage.setItem(ACTOR_ID_KEY, payload.actor.id);
    window.localStorage.setItem(ACTOR_ROLE_KEY, payload.actor.role);
  }

  return payload;
}

function clearAuth() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(ACTOR_ID_KEY);
  window.localStorage.removeItem(ACTOR_ROLE_KEY);
}

function getAuthState() {
  if (typeof window === 'undefined') {
    return { role: 'admin', actorId: 'admin.console', hasToken: false };
  }

  return {
    role: window.localStorage.getItem(ACTOR_ROLE_KEY) || 'admin',
    actorId: window.localStorage.getItem(ACTOR_ID_KEY) || 'admin.console',
    hasToken: Boolean(window.localStorage.getItem(ACCESS_TOKEN_KEY)),
  };
}

export const api = {
  get: (path, query) => request(withQuery(path, query)),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body || {}) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body || {}) }),
};

export const authSession = {
  issueDevToken,
  clearAuth,
  getAuthState,
};

export { API_BASE };
