// src/app/shopkeeper/dashboard/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import {
  Package, Power, Plus, Store, CheckCircle,
  XCircle, RefreshCw, AlertCircle, ChevronRight,
} from "lucide-react";
import { formatRupee, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

export default function ShopkeeperDashboard() {
  const router = useRouter();
  const { user, isLoading } = useRequireAuth("SHOPKEEPER");

  const [shop,     setShop]     = useState<any>(null);
  const [orders,   setOrders]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [noShop,   setNoShop]   = useState(false);
  const [toggling, setToggling] = useState(false);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setNoShop(false);
    try {
      const sr = await api.get("/shops/mine/");
      const shopData = sr.data.data || sr.data;
      setShop(shopData);

      try {
        const or = await api.get("/orders/shop/", {
          params: { status: "PENDING" },
        });
        const d = or.data.data?.results || or.data.data || [];
        setOrders(Array.isArray(d) ? d : []);
      } catch {
        setOrders([]);
      }
    } catch (e: any) {
      if (e.response?.status === 404) {
        setNoShop(true);
      } else {
        toast.error("Load error: " + (e.response?.status || e.message));
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoading && user?.role === "SHOPKEEPER") {
      loadAll();
    }
  }, [isLoading, user, loadAll]);

  // Auto refresh every 60 seconds
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") loadAll();
    }, 60000);
    return () => clearInterval(id);
  }, [user, loadAll]);

  const toggleOpen = async () => {
    if (!shop?.slug) return;
    setToggling(true);
    try {
      const r = await api.post(`/shops/${shop.slug}/toggle-open/`);
      const isOpen = r.data.data?.is_open ?? !shop.is_open;
      setShop((p: any) => ({ ...p, is_open: isOpen }));
      toast.success(isOpen ? "🟢 Shop Open!" : "🔴 Shop Closed!");
    } catch {
      toast.error("Toggle nahi hua");
    } finally {
      setToggling(false);
    }
  };

  const updateOrder = async (num: string, status: string) => {
    try {
      await api.post(`/orders/${num}/status/`, { status });
      toast.success(status === "CONFIRMED" ? "✅ Order Accept!" : "❌ Order Reject!");
      loadAll();
    } catch {
      toast.error("Update nahi hua");
    }
  };

  if (isLoading || (loading && !shop && !noShop)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TopNav />
        <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
          <div className="h-48 bg-gray-200 rounded-3xl animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
        <BotNav />
      </div>
    );
  }

  if (noShop) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TopNav />
        <div className="max-w-md mx-auto px-4 pt-16 pb-24 text-center">
          <div className="w-28 h-28 grad rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-purple-300">
            <Store size={52} className="text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">
            Koi Shop Nahi Hai
          </h2>
          <p className="text-gray-400 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            QabiFly pe apni dukan register karein aur customers tak pahunchein
          </p>
          <button
            onClick={() => router.push("/shopkeeper/shop/create")}
            className="grad text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-purple-200 inline-flex items-center gap-2"
          >
            <Plus size={20} /> Naya Shop Banayein
          </button>
          <br />
          <button onClick={loadAll} className="mt-4 text-purple-600 font-bold text-sm">
            <RefreshCw size={13} className="inline mr-1" />
            Refresh
          </button>
        </div>
        <BotNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 pb-24">
        {/* Shop Status Card */}
        <div
          className={`rounded-3xl p-5 mb-5 text-white shadow-xl ${
            shop?.is_open
              ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-300/30"
              : "bg-gradient-to-br from-gray-500 to-gray-700"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white/60 text-xs uppercase tracking-wide mb-0.5">
                Aapki Shop
              </p>
              <h2 className="font-extrabold text-xl truncate">{shop?.name}</h2>
              {shop?.category?.name && (
                <p className="text-white/70 text-xs mt-0.5">{shop.category.name}</p>
              )}
              {(shop?.village || shop?.district) && (
                <p className="text-white/60 text-xs mt-1">
                  📍 {[shop.village, shop.district].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button
                onClick={loadAll}
                className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center"
              >
                <RefreshCw size={15} className="text-white" />
              </button>
              <button
                onClick={toggleOpen}
                disabled={toggling}
                className="px-3 py-1.5 rounded-full text-xs font-extrabold border border-white/30 bg-white/20 text-white flex items-center gap-1.5 disabled:opacity-60"
              >
                <Power size={12} />
                {toggling ? "..." : shop?.is_open ? "Open" : "Closed"}
              </button>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {[
              { l: "Pending", v: orders.length },
              { l: "Rating",  v: shop?.average_rating || "—" },
              { l: "Reviews", v: shop?.total_reviews || 0 },
            ].map((s) => (
              <div key={s.l} className="flex-1 bg-white/20 rounded-xl p-2.5 text-center">
                <p className="font-extrabold text-lg leading-none">{s.v}</p>
                <p className="text-white/70 text-[9px] mt-0.5 uppercase">{s.l}</p>
              </div>
            ))}
          </div>

          {shop?.status && shop.status !== "ACTIVE" && (
            <div className="mt-3 bg-yellow-400/20 border border-yellow-300/30 rounded-xl px-3 py-2 flex items-center gap-2">
              <AlertCircle size={13} className="text-yellow-200" />
              <p className="text-yellow-100 text-xs">
                Status: <strong>{shop.status}</strong> — Admin approval pending
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { l: "📦 Products",   h: "/shopkeeper/products"  },
            { l: "📋 All Orders", h: "/shopkeeper/orders"    },
            { l: "🏪 Shop",       h: "/shopkeeper/shop"      },
            { l: "💰 Earnings",   h: "/wallet"               },
          ].map((a) => (
            <button
              key={a.h}
              onClick={() => router.push(a.h)}
              className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all active:scale-95 text-left flex items-center justify-between"
            >
              <span className="font-bold text-sm text-gray-800">{a.l}</span>
              <ChevronRight size={14} className="text-gray-300" />
            </button>
          ))}
        </div>

        {/* Pending Orders */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-gray-900 flex items-center gap-2">
            🔔 New Orders
            {orders.length > 0 && (
              <span className="text-xs text-white grad px-2 py-0.5 rounded-full">
                {orders.length}
              </span>
            )}
          </h2>
          <button onClick={() => router.push("/shopkeeper/orders")}
            className="text-xs text-purple-600 font-bold">
            Sab →
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <Package size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Abhi koi pending order nahi</p>
            <p className="text-xs text-gray-300 mt-1">Auto-refresh: 60 sec</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o: any) => (
              <div
                key={o.id}
                className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-purple-500"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-sm">#{o.order_number}</span>
                  <span className="font-extrabold text-purple-600">
                    {formatRupee(o.total_amount)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-0.5">
                  👤 {o.buyer_name || "Customer"} · {o.total_items} items
                </p>
                {o.delivery_address && (
                  <p className="text-xs text-gray-400 mb-0.5 truncate">
                    📍 {o.delivery_address}
                  </p>
                )}
                <p className="text-xs text-gray-400 mb-3">{timeAgo(o.created_at)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateOrder(o.order_number, "CANCELLED")}
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-red-50 border border-red-200 text-red-500 text-xs font-bold rounded-xl"
                  >
                    <XCircle size={13} /> Reject
                  </button>
                  <button
                    onClick={() => updateOrder(o.order_number, "CONFIRMED")}
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 grad text-white text-xs font-bold rounded-xl shadow-md"
                  >
                    <CheckCircle size={13} /> Accept
                  </button>
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
