"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { shopApi, orderApi } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import {
  Package, TrendingUp, Power, AlertCircle,
  CheckCircle, XCircle, ChevronRight, Plus,
} from "lucide-react";
import { formatRupee, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

export default function ShopkeeperDashboard() {
  const router               = useRouter();
  const { user, isAuth }     = useAuthStore();
  const [shop,     setShop]     = useState<any>(null);
  const [orders,   setOrders]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [toggling, setToggling] = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (!isAuth) { router.push("/login"); return; }
    if (user?.role !== "SHOPKEEPER") { router.push("/"); return; }
    if (fetched.current) return;
    fetched.current = true;
    loadData();
  }, [isAuth, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [shopRes, ordersRes] = await Promise.all([
        shopApi.mine(),
        orderApi.shopOrders("PENDING"),
      ]);
      setShop(shopRes.data.data);
      const d = ordersRes.data.data?.results || ordersRes.data.data || [];
      setOrders(Array.isArray(d) ? d : []);
    } catch (e: any) {
      if (e.response?.status === 404) setShop(null);
      else toast.error("Data load nahi hua");
    } finally { setLoading(false); }
  };

  const toggleOpen = async () => {
    if (!shop) return;
    setToggling(true);
    try {
      const r = await shopApi.toggle(shop.slug);
      setShop((p: any) => ({ ...p, is_open: r.data.data?.is_open }));
      toast.success(r.data.data?.is_open ? "🟢 Shop Open ho gaya!" : "🔴 Shop Closed ho gaya!");
    } catch { toast.error("Status change nahi hua"); }
    finally { setToggling(false); }
  };

  const updateOrder = async (orderNum: string, status: string) => {
    try {
      await orderApi.setStatus(orderNum, status);
      toast.success(status === "CONFIRMED" ? "✅ Order accept kar liya!" : "Order reject ho gaya");
      loadData();
    } catch { toast.error("Status update nahi hua"); }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        {[1,2,3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
        ))}
      </div>
      <BotNav />
    </div>
  );

  // No shop
  if (!shop) return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-10 pb-24 text-center">
        <div className="w-20 h-20 grad rounded-3xl mx-auto mb-5 flex items-center justify-center shadow-xl shadow-purple-200">
          <span className="text-4xl">🏪</span>
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">
          Apni Shop Banayein
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Abhi tak koi shop register nahi hai
        </p>
        <button
          onClick={() => router.push("/shopkeeper/shop/create")}
          className="grad text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-purple-200 flex items-center gap-2 mx-auto"
        >
          <Plus size={16} /> Naya Shop Banayein
        </button>
      </div>
      <BotNav />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 pb-24">

        {/* Shop Status Card */}
        <div
          className={`rounded-3xl p-5 mb-5 text-white shadow-xl ${
            shop.is_open
              ? "bg-gradient-to-r from-green-500 to-emerald-600"
              : "bg-gradient-to-r from-gray-500 to-gray-600"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs mb-1">Aapki Shop</p>
              <h2 className="font-extrabold text-xl leading-tight truncate">
                {shop.name}
              </h2>
              <p className="text-white/70 text-xs mt-1">
                {shop.village}, {shop.district}
              </p>
            </div>
            <button
              onClick={toggleOpen}
              disabled={toggling}
              className="flex items-center gap-1.5 bg-white/20 border border-white/30 text-white text-xs font-bold px-3 py-2 rounded-full ml-3 flex-shrink-0 hover:bg-white/30 transition-all disabled:opacity-60"
            >
              <Power size={13} />
              {toggling ? "..." : shop.is_open ? "Open ●" : "Closed ○"}
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-2 mt-4">
            {[
              { l: "Pending",  v: orders.length,  c: "bg-white/20" },
              { l: "Rating",   v: shop.average_rating || "—", c: "bg-white/20" },
              { l: "Reviews",  v: shop.total_reviews || 0, c: "bg-white/20" },
            ].map((s) => (
              <div key={s.l} className={`flex-1 ${s.c} rounded-xl p-2.5 text-center`}>
                <p className="font-extrabold text-lg leading-none">{s.v}</p>
                <p className="text-white/70 text-[10px] mt-0.5 font-medium">{s.l}</p>
              </div>
            ))}
          </div>

          {!shop.is_approved && (
            <div className="mt-3 flex items-center gap-2 bg-yellow-400/20 border border-yellow-300/30 rounded-xl px-3 py-2">
              <AlertCircle size={14} className="text-yellow-200 flex-shrink-0" />
              <p className="text-yellow-100 text-xs font-medium">
                Shop approval pending hai — Admin review karega.
              </p>
            </div>
          )}
        </div>

        {/* Pending Orders */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-gray-900">
            🔔 New Orders ({orders.length})
          </h2>
          <button
            onClick={() => router.push("/shopkeeper/orders")}
            className="text-xs text-purple-600 font-bold flex items-center gap-0.5"
          >
            Sab dekho <ChevronRight size={13} />
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm mb-4">
            <Package size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              Abhi koi pending order nahi hai
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {orders.map((o: any) => (
              <div key={o.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-sm text-gray-900">
                    #{o.order_number}
                  </span>
                  <span className="font-extrabold text-purple-600 text-sm">
                    {formatRupee(o.total_amount)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-0.5">
                  👤 {o.buyer_name || o.buyer_virtual_number || "Customer"}
                  · {o.total_items} items
                </p>
                <p className="text-xs text-gray-400 mb-0.5">
                  📍 {o.delivery_address}
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  🕐 {timeAgo(o.created_at)}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateOrder(o.order_number, "CANCELLED")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 border border-red-200 text-red-500 text-xs font-bold rounded-xl"
                  >
                    <XCircle size={13} /> Reject
                  </button>
                  <button
                    onClick={() => updateOrder(o.order_number, "CONFIRMED")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-50 border border-green-200 text-green-600 text-xs font-bold rounded-xl"
                  >
                    <CheckCircle size={13} /> Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {[
            { l: "All Orders History",   h: "/shopkeeper/orders" },
            { l: "Shop Settings",         h: "/shopkeeper/shop"   },
            { l: "Wallet & Earnings",     h: "/wallet"            },
          ].map((item) => (
            <button key={item.h} onClick={() => router.push(item.h)}
              className="w-full flex items-center justify-between px-4 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 text-left transition-colors">
              <span className="text-sm font-semibold text-gray-700">{item.l}</span>
              <ChevronRight size={15} className="text-gray-300" />
            </button>
          ))}
        </div>

      </div>
      <BotNav />
    </div>
  );
}