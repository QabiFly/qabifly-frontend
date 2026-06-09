"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { orderApi } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import { Package, CheckCircle, XCircle, Truck } from "lucide-react";
import { formatRupee, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_TABS = [
  { k: "PENDING",   l: "Pending",   c: "#F59E0B" },
  { k: "CONFIRMED", l: "Confirmed", c: "#4B7BF5" },
  { k: "READY",     l: "Ready",     c: "#8B5CF6" },
  { k: "DELIVERED", l: "Delivered", c: "#059669" },
  { k: "CANCELLED", l: "Cancelled", c: "#EF4444" },
];

export default function ShopkeeperOrdersPage() {
  const router = useRouter();
  const { user, isAuth } = useAuthStore();
  const [tab,     setTab]     = useState("PENDING");
  const [orders,  setOrders]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuth || user?.role !== "SHOPKEEPER") {
      router.push("/"); return;
    }
    loadOrders(tab);
  }, [tab, isAuth]);

  const loadOrders = async (status: string) => {
    setLoading(true);
    try {
      const r = await orderApi.shopOrders(status);
      const d = r.data.data?.results || r.data.data || [];
      setOrders(Array.isArray(d) ? d : []);
    } catch { toast.error("Orders load nahi hue"); }
    finally { setLoading(false); }
  };

  const setStatus = async (orderNum: string, status: string) => {
    try {
      await orderApi.setStatus(orderNum, status);
      toast.success("Status update ho gaya!");
      loadOrders(tab);
    } catch { toast.error("Update nahi hua"); }
  };

  const getAction = (status: string) => {
    if (status === "PENDING")   return { l: "Confirm Karein", s: "CONFIRMED", icon: CheckCircle };
    if (status === "CONFIRMED") return { l: "Ready Mark Karein", s: "READY", icon: Package };
    if (status === "READY")     return { l: "Out for Delivery", s: "OUT_FOR_DELIVERY", icon: Truck };
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto pb-24">

        <div className="px-4 pt-4 mb-3">
          <h1 className="text-xl font-extrabold text-gray-900">Shop Orders</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
          {STATUS_TABS.map((s) => (
            <button key={s.k} onClick={() => setTab(s.k)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                tab === s.k ? "text-white border-transparent" : "bg-white text-gray-500 border-gray-200"
              }`}
              style={tab === s.k ? { backgroundColor: s.c } : {}}
            >
              {s.l}
            </button>
          ))}
        </div>

        <div className="px-4">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
              <Package size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Is status mein koi order nahi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o: any) => {
                const action = getAction(o.status);
                return (
                  <div key={o.id} className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-bold text-sm">#{o.order_number}</span>
                      <span className="font-extrabold text-purple-600 text-sm">
                        {formatRupee(o.total_amount)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-0.5">
                      👤 {o.buyer_name || "Customer"} · {o.total_items} items
                    </p>
                    <p className="text-xs text-gray-400 mb-0.5">📍 {o.delivery_address}</p>
                    <p className="text-xs text-gray-400 mb-3">🕐 {timeAgo(o.created_at)}</p>
                    {action && (
                      <div className="flex gap-2">
                        {o.status === "PENDING" && (
                          <button
                            onClick={() => setStatus(o.order_number, "CANCELLED")}
                            className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-red-50 border border-red-200 text-red-500 text-xs font-bold rounded-xl"
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        )}
                        <button
                          onClick={() => setStatus(o.order_number, action.s)}
                          className="flex-1 flex items-center justify-center gap-1 py-2.5 grad text-white text-xs font-bold rounded-xl"
                        >
                          {action.l}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <BotNav />
    </div>
  );
}