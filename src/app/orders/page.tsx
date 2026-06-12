"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { orderApi } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import { Package, ChevronRight } from "lucide-react";
import { formatRupee, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_COLOR: Record<string, string> = {
  PENDING:          "#F59E0B",
  CONFIRMED:        "#4B7BF5",
  READY:            "#8B5CF6",
  OUT_FOR_DELIVERY: "#F97316",
  DELIVERED:        "#059669",
  CANCELLED:        "#EF4444",
};

export default function OrdersPage() {
  const router    = useRouter();
  const { isAuth } = useAuthStore();
  const [orders,  setOrders]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (!isAuth) { router.push("/login"); return; }
    if (fetched.current) return;
    fetched.current = true;

    orderApi.mine()
      .then((r) => {
        const d = r.data.data?.results || r.data.data || [];
        setOrders(Array.isArray(d) ? d : []);
      })
      .catch(() => toast.error("Orders loaded yet!"))
      .finally(() => setLoading(false));
  }, [isAuth]);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 pb-24">
        <h1 className="text-xl font-extrabold text-gray-900 mb-4">
          My Orders 📦
        </h1>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package size={56} className="text-gray-200 mx-auto mb-4" />
            <h3 className="text-gray-500 font-bold">Koi order nahi</h3>
            <p className="text-gray-400 text-sm mt-1 mb-5">
              Order from shop
            </p>
            <button onClick={() => router.push("/shops")}
              className="grad text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-purple-200">
              Shops
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o: any) => (
              <button key={o.id}
                onClick={() => router.push(`/orders/${o.order_number}`)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-3 active:scale-[0.99]">
                <div className="w-10 h-10 grad rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-sm text-gray-900">
                      #{o.order_number}
                    </span>
                    <span
                      className="text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white flex-shrink-0"
                      style={{ backgroundColor: STATUS_COLOR[o.status] || "#6B7280" }}
                    >
                      {o.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{o.shop_name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">{timeAgo(o.created_at)}</span>
                    <span className="font-extrabold text-purple-600 text-sm">
                      {formatRupee(o.total_amount)}
                    </span>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
      <BotNav />
    </div>
  );
}
