"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/stores/auth";

export type CurrentUser = { name: string; avatar?: string };

type MeResponse = {
  displayName?: string | null;
  fullName?: string | null;
  photos?: unknown;
};

function firstPhoto(photos: unknown): string | undefined {
  if (!Array.isArray(photos) || photos.length === 0) return undefined;
  const p = photos[0] as unknown;
  if (typeof p === "string") return p || undefined;
  if (p && typeof p === "object" && "url" in p && typeof (p as { url: unknown }).url === "string") {
    return (p as { url: string }).url || undefined;
  }
  return undefined;
}

// One in-flight/cached lookup per access token, shared by the sidebar, the mobile
// drawer and any page, so mounting several of them doesn't fan out into N /users/me calls.
const cache = new Map<string, Promise<CurrentUser | null>>();

function load(token: string): Promise<CurrentUser | null> {
  let hit = cache.get(token);
  if (!hit) {
    hit = api
      .get<MeResponse>("/users/me", token)
      .then((me) => ({
        name: (me.displayName || me.fullName || "").trim() || "You",
        avatar: firstPhoto(me.photos),
      }))
      .catch(() => {
        cache.delete(token);
        return null;
      });
    cache.set(token, hit);
  }
  return hit;
}

/** The signed-in user's real name/avatar, from the API (null until loaded / signed out). */
export function useCurrentUser(): CurrentUser | null {
  const accessToken = useAuth((s) => s.accessToken);
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setUser(null);
      return;
    }
    let live = true;
    load(accessToken).then((u) => {
      if (live) setUser(u);
    });
    return () => {
      live = false;
    };
  }, [accessToken]);

  return user;
}
