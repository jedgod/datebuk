import { create } from "zustand";
import { api } from "@/lib/api";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  currentSessionId: string | null;
  refreshTokenId: string | null;
  isHydrated: boolean;
  setTokens: (accessToken: string | null, refreshToken: string | null, userId?: string | null) => void;
  hydrate: () => void;
  logout: () => void;
  login: (email: string, password: string) => Promise<
    | { requiresOtp: true; userId: string; tempToken: string }
    | { requiresOtp: false }
  >;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  refresh: () => Promise<string | null>;
};

const LS_KEY = "datepage.auth.v1";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function setAccessCookie(token: string | null) {
  if (typeof document === "undefined") return;
  if (!token) {
    document.cookie = "dp_access=; Path=/; Max-Age=0; SameSite=Lax";
    return;
  }
  document.cookie = `dp_access=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
}

function readInitialAuth() {
  if (typeof window === "undefined") {
    return {
      accessToken: null as string | null,
      refreshToken: null as string | null,
      userId: null as string | null,
      isHydrated: false,
    };
  }

  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const tokenFromStorage = parsed.accessToken ?? null;
      const tokenFromCookie = getCookie("dp_access");
      return {
        accessToken: tokenFromStorage ?? tokenFromCookie,
        refreshToken: parsed.refreshToken ?? null,
        userId: parsed.userId ?? null,
        isHydrated: true,
      };
    }
  } catch {
    // fall through to cookie fallback
  }

  return {
    accessToken: getCookie("dp_access"),
    refreshToken: null as string | null,
    userId: null as string | null,
    isHydrated: true,
  };
}

const initialAuth = readInitialAuth();

export const useAuth = create<AuthState>((set, get) => ({
  accessToken: initialAuth.accessToken,
  refreshToken: initialAuth.refreshToken,
  userId: initialAuth.userId,
  currentSessionId: null,
  refreshTokenId: null,
  isHydrated: initialAuth.isHydrated,

  setTokens: (accessToken, refreshToken, userId) => {
    set((state) => ({
      accessToken,
      refreshToken,
      userId: userId === undefined ? state.userId : userId,
    }));
    setAccessCookie(accessToken);
    if (typeof window !== 'undefined') {
      const state = get();
      localStorage.setItem(LS_KEY, JSON.stringify({ accessToken, refreshToken, userId: state.userId }));
    }
  },

  hydrate: () => {
    if (typeof window === 'undefined') {
      set({ isHydrated: true });
      return;
    }
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return set({ isHydrated: true });
      const parsed = JSON.parse(raw);
      const tokenFromCookie = getCookie("dp_access");
      set({
        accessToken: parsed.accessToken ?? tokenFromCookie ?? null,
        refreshToken: parsed.refreshToken ?? null,
        userId: parsed.userId ?? null,
        isHydrated: true,
      });
      setAccessCookie(parsed.accessToken ?? tokenFromCookie ?? null);
    } catch {
      set({ isHydrated: true });
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LS_KEY);
    }
    setAccessCookie(null);
    set({ accessToken: null, refreshToken: null, userId: null });
  },

  login: async (email, password) => {
    const response = await fetch("/api/auth/user-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    const payload = await response.json().catch(() => null as any);
    if (!response.ok) {
      const message = payload?.message || "Login failed";
      throw new Error(String(message));
    }

    const accessToken = payload?.accessToken;
    const refreshToken = payload?.refreshToken ?? null;
    const userId = payload?.userId ?? payload?.user?.id ?? null;

    if (payload?.requiresOtp && payload?.userId && payload?.tempToken) {
      return {
        requiresOtp: true,
        userId: String(payload.userId),
        tempToken: String(payload.tempToken),
      };
    }

    if (!accessToken) {
      throw new Error("Authentication service returned an invalid response");
    }

    set({ accessToken, refreshToken, userId });
    setAccessCookie(accessToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_KEY, JSON.stringify({ accessToken, refreshToken, userId }));
    }
    return { requiresOtp: false };
  },

  signup: async (email, password, displayName) => {
    const res = await api.post<{ accessToken: string; refreshToken: string; userId: string }>("/api/auth/signup", { email, password, displayName });
    set({ accessToken: res.accessToken, refreshToken: res.refreshToken, userId: res.userId });
    setAccessCookie(res.accessToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_KEY, JSON.stringify({ accessToken: res.accessToken, refreshToken: res.refreshToken, userId: res.userId }));
    }
  },

  refresh: async () => {
    const rt = get().refreshToken;
    if (!rt) return null;
    const res = await api.post<{ accessToken: string; refreshToken?: string }>("/api/auth/refresh", { refreshToken: rt });
    const newAccess = res.accessToken;
    const newRefresh = res.refreshToken ?? rt;
    set({ accessToken: newAccess, refreshToken: newRefresh });
    setAccessCookie(newAccess);
    localStorage.setItem(LS_KEY, JSON.stringify({ accessToken: newAccess, refreshToken: newRefresh, userId: get().userId }));
    return newAccess;
  },
}));
