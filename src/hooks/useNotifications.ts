// src/hooks/useNotifications.ts
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function useNotifications() {
  const { isAuth } = useAuthStore();
  const [count, setCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    if (!isAuth) return;
    try {
      const r = await api.get("/notifications/unread-count/");
      setCount(r.data?.data?.count || 0);
    } catch {}
  }, [isAuth]);

  useEffect(() => {
    if (!isAuth) return;
    check();
    timerRef.current = setInterval(check, 20000); // 20 sec
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isAuth, check]);

  return { count };
}
