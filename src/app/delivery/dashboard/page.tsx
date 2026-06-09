"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { orderApi } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import { Package, MapPin, CheckCircle, Navigation } from "lucide-react";
import { formatRupee, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

export default function DeliveryDashboard() {
  const router = useRouter();
  const { user, isAuth } = useAuthStore();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (!isAuth) { router.push("/login"); return; }
    if (user?.role !== "DELIVERY_BOY") { router.push("/"); return; }
    if (fetched.current) return;
    fetched.current = true;
    loadDeliveries();
  }, [isAuth, user]);

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const r = await orderApi.deliveries();
      const d = r.data.data?.results || r.data.data || [];
      setDeliveries(Array.isArray(d) ? d : []);
    } catch { toast.error("Deliveries load nahi hue"); }
    finally { setLoading(false); }
  };

  const acceptDelivery = async (orderNum: string) => {
    try {
      await orderApi.accept(orderNum);
      toast.success("✅ Delivery accept kar li!");
      loadDeliveries();
    } catch { toast.error("Accept nahi hua"); }
  };

  const markDelivered = async (orderNum: string) => {
    const otp = window.prompt("Customer ka OTP daalen:");
    if (!otp) return;
    try {
      await orderApi.deliverOTP(orderNum, otp);
      toast.success("✅ Delivery complete! Payment credited.");
      loadDeliveries();
    } catch { toast.error("OTP galat hai"); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 pb-24">

        {/* Profile Card */}
        <div className="grad rounded-3xl p-5 mb-5 text-white shadow-xl shadow-purple-300/30">
          <p className="text-white/70 text-xs font-medium">Delivery Boy Dashboard</p>
          <h1 className="font-extrabold text-xl mt-1">
            {user?.virtual_name || user?.full_name}
          </h1>
          {user?.virtual_number && (
            <p className="font-mono text-white/70 text-sm mt-1">
              {user.virtual_number}
            </p>
          )}
          <div className="flex gap-2 mt-4">
            <div className="flex-1 bg-white/20 rounded-xl p-2.5 text-center">
              <p className="font-extrabold text-lg">{deliveries.length}</p>
              <p className="text-white/70 text-[10px] font-medium">Active</p>
            </div>
            <div className="flex-1 bg-white/20 rounded-xl p-2.5 text-center">
              <p className="font-extrabold text-lg">—</p>
              <p className="text-white/70 text-[10px] font-medium">Today</p>
            </div>
            <div className="flex-1 bg-white/20 rounded-xl p-2.5 text-center">
              <p className="font-extrabold text-lg">—</p>
              <p className="text-white/70 text-[10px] font-medium">Earned</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-gray-900">Active Deliveries</h2>
          <button
            onClick={() => { fetched.current = false; loadDeliveries(); }}
            className="text-xs text-purple-600 font-bold"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : deliveries.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <Package size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              Abhi koi delivery nahi
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {deliveries.map((d: any) => (
              <div key={d.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-sm">
                    #{d.order_number}
                  </span>
                  <span className="font-extrabold text-green-600 text-sm">
                    {formatRupee(d.delivery_charge || "30")}
                  </span>
                </div>
                <div className="flex items-start gap-2 mb-1">
                  <MapPin size={13} className="text-purple-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600">{d.delivery_address}</p>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  🕐 {timeAgo(d.created_at)} · {d.total_items} items
                </p>

                {d.status === "OUT_FOR_DELIVERY" && d.assigned_to ? (
                  <button
                    onClick={() => markDelivered(d.order_number)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 grad text-white text-xs font-bold rounded-xl shadow-md"
                  >
                    <CheckCircle size={14} />
                    OTP Verify + Deliver Karein
                  </button>
                ) : (
                  <button
                    onClick={() => acceptDelivery(d.order_number)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-50 border border-green-200 text-green-600 text-xs font-bold rounded-xl"
                  >
                    <Navigation size={14} />
                    Accept Delivery
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <BotNav />
    </div>
  );
}