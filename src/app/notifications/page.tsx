// src/app/notifications/page.tsx
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import { Bell, RefreshCw, Check } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export default function NotificationsPage() {
  const router              = useRouter();
  const { isAuth, isLoading } = useAuthStore();
  const [notifs,   setNotifs]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [unread,   setUnread]   = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api.get("/notifications/");
      const d = r.data.data?.results || r.data.data || [];
      const list = Array.isArray(d) ? d : [];
      setNotifs(list);
      setUnread(list.filter((n: any) => !n.is_read).length);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuth) { router.push("/login"); return; }

    load();

    // Auto-refresh every 30 seconds
    intervalRef.current = setInterval(load, 30000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuth, isLoading, load]);

  const markAll = async () => {
    try {
      await api.post("/notifications/read-all/");
      setNotifs((p) => p.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch {}
  };

  const markOne = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read/`);
      setNotifs((p) =>
        p.map((n) => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnread((c) => Math.max(0, c - 1));
    } catch {}
  };

  const typeIcon: Record<string, string> = {
    ORDER:    "📦",
    PAYMENT:  "💰",
    WALLET:   "💳",
    DELIVERY: "🚴",
    SYSTEM:   "🔔",
    KYC:      "🛡",
    SHOP:     "🏪",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 pb-24">

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">Notifications 🔔</h1>
            {unread > 0 && (
              <p className="text-xs text-purple-600 font-semibold mt-0.5">
                {unread} unread
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center"
            >
              <RefreshCw size={15} className="text-gray-500" />
            </button>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="flex items-center gap-1 text-xs text-purple-600 font-bold bg-purple-50 px-3 py-1.5 rounded-full"
              >
                <Check size={12} /> Sab Read
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <Bell size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">Koi notification nahi</p>
            <p className="text-xs text-gray-300 mt-1">Auto-refresh: 30 sec</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifs.map((n: any) => (
              <button
                key={n.id}
                onClick={() => !n.is_read && markOne(n.id)}
                className={`w-full text-left rounded-2xl px-4 py-3 shadow-sm flex items-start gap-3 transition-all ${
                  !n.is_read
                    ? "bg-purple-50 border border-purple-100"
                    : "bg-white"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${
                    !n.is_read ? "grad" : "bg-gray-100"
                  }`}
                >
                  <span className={!n.is_read ? "text-white" : ""}>
                    {typeIcon[n.notification_type] || "🔔"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${
                    !n.is_read ? "text-gray-900" : "text-gray-600"
                  }`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {timeAgo(n.created_at)}
                  </p>
                </div>
                {!n.is_read && (
                  <div className="w-2 h-2 grad rounded-full flex-shrink-0 mt-1" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      <BotNav />
    </div>
  );
}
