"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { notifApi } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import { Bell } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export default function NotificationsPage() {
  const router     = useRouter();
  const { isAuth } = useAuthStore();
  const [notifs,  setNotifs]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (!isAuth) { router.push("/login"); return; }
    if (fetched.current) return;
    fetched.current = true;

    notifApi.get()
      .then((r) => {
        const d = r.data.data?.results || r.data.data || [];
        setNotifs(Array.isArray(d) ? d : []);
        notifApi.markAll().catch(() => {});
      })
      .finally(() => setLoading(false));
  }, [isAuth]);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 pb-24">
        <h1 className="text-xl font-extrabold text-gray-900 mb-4">
          Notifications 🔔
        </h1>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <Bell size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Koi notification nahi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifs.map((n: any) => (
              <div key={n.id}
                className={`bg-white rounded-2xl px-4 py-3 shadow-sm flex items-start gap-3 ${
                  !n.is_read ? "border-l-4 border-purple-500" : ""
                }`}>
                <div className="w-9 h-9 grad rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bell size={15} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BotNav />
    </div>
  );
}