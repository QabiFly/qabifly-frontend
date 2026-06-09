"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { orderApi } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import { Package } from "lucide-react";
import { formatRupee, timeAgo } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  PENDING:          "#F59E0B",
  CONFIRMED:        "#4B7BF5",
  READY:            "#8B5CF6",
  OUT_FOR_DELIVERY: "#F97316",
  DELIVERED:        "#059669",
  CANCELLED:        "#EF4444",
};

export default function DeliveryOrdersPage() {
  const router = useRouter();
  const { user, isAuth } = useAuthStore();
  const [orders,  setOrders]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (!isAuth || user?.role !== "DELIVERY_BOY") { router.push("/"); return; }
    if (fetched.current) return;
    fetched.current = true;

    orderApi.deliveries()
      .then((r) => {
        const d = r.data.data?.results || r.data.data || [];
        setOrders(Array.isArray(d) ? d : []);
      })
      .finally(() => setLoading(false));
  }, [isAuth]);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 pb-24">
        <h1 className="text-xl font-extrabold text-gray-900 mb-4">
          Meri Deliveries
        </h1>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <Package size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Koi delivery history nahi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o: any) => (
              <div key={o.id}
                className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-sm">
                    #{o.order_number}
                  </span>
                  <span
                    className="text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: STATUS_COLOR[o.status] || "#6B7280" }}
                  >
                    {o.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-gray-400">📍 {o.delivery_address}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-400">🕐 {timeAgo(o.created_at)}</p>
                  <p className="font-bold text-sm text-green-600">
                    {formatRupee(o.delivery_charge || "30")}
                  </p>
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