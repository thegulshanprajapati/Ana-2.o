"use client";

import { useContext, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { AppContext } from "@/context/AppContext";

const TRACK_ENDPOINT = "/api/analytics";
const HEARTBEAT_INTERVAL_MS = 30 * 1000;
const VISIT_DEDUPE_WINDOW_MS = 2500;

const SESSION_STORAGE_KEY = "ana_visit_session_id";
const LAST_VISIT_STORAGE_KEY = "ana_last_visit_meta";

const normalizePath = (value: string | null): string => {
  if (!value) {
    return "/";
  }
  return value.startsWith("/") ? value : `/${value}`;
};

const createSessionId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const getOrCreateSessionId = (): string => {
  const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }
  const generated = createSessionId();
  sessionStorage.setItem(SESSION_STORAGE_KEY, generated);
  return generated;
};

const shouldSkipDuplicateVisit = (pathName: string): boolean => {
  try {
    const raw = sessionStorage.getItem(LAST_VISIT_STORAGE_KEY);
    const now = Date.now();

    if (raw) {
      const parsed = JSON.parse(raw) as { pathName?: string; ts?: number };
      if (
        parsed.pathName === pathName &&
        typeof parsed.ts === "number" &&
        now - parsed.ts < VISIT_DEDUPE_WINDOW_MS
      ) {
        return true;
      }
    }

    sessionStorage.setItem(
      LAST_VISIT_STORAGE_KEY,
      JSON.stringify({ pathName, ts: now })
    );
  } catch {
    // Ignore storage parsing errors and continue tracking.
  }

  return false;
};

const track = async (payload: {
  path: string;
  sessionId: string;
  userId?: string | null;
  type: "visit" | "heartbeat";
}): Promise<void> => {
  try {
    await fetch(TRACK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    // Tracking failures must never block user navigation.
  }
};

export function VisitTracker() {
  const pathname = usePathname();
  const { user } = useContext(AppContext);
  const sessionIdRef = useRef<string>("");

  const userId = user?.id || null;
  const normalizedPath = normalizePath(pathname);

  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();
  }, []);

  useEffect(() => {
    const sessionId = sessionIdRef.current || getOrCreateSessionId();
    sessionIdRef.current = sessionId;

    if (shouldSkipDuplicateVisit(normalizedPath)) {
      return;
    }

    void track({
      type: "visit",
      path: normalizedPath,
      sessionId,
      userId,
    });
  }, [normalizedPath, userId]);

  useEffect(() => {
    const sessionId = sessionIdRef.current || getOrCreateSessionId();
    sessionIdRef.current = sessionId;

    const sendHeartbeat = () => {
      void track({
        type: "heartbeat",
        path: normalizedPath,
        sessionId,
        userId,
      });
    };

    sendHeartbeat();
    const timer = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [normalizedPath, userId]);

  return null;
}
