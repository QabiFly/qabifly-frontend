// src/app/shopkeeper/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGuard } from "@/lib/auth-guard";
import { api } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import {
  Package,
  Power,
  Plus,
  Store,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { formatRupee, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

export default function ShopkeeperDashboard() {
  const router = useRouter();
  const { ready } = useGuard("SHOPKEEPER");

  const [shop, setShop] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [noShop, setNoShop] = useState(false);
  const [toggling, setToggling] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadAll = useCallback(async () => {
    if (!ready) return;

    setLoading(true);

    try {
      const shopResponse = await api.get("/shops/mine/");
      const shopData = shopResponse.data?.data || shopResponse.data;

      setShop(shopData);
      setNoShop(false);

      try {
        const ordersResponse = await api.get("/orders/shop/", {
          params: { status: "PENDING" },
        });

        const ordersData =
          ordersResponse.data?.data?.results ||
          ordersResponse.data?.data ||
          [];

        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } catch {
        setOrders([]);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setNoShop(true);
        setShop(null);
      } else {
        toast.error("Shop dashboard load nahi hua");
      }
    } finally {
      setLoading(false);
    }
  }, [ready]);

  useEffect(() => {
    if (!ready) return;

    loadAll();

    timerRef.current = setInterval(() => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        loadAll();
      }
    }, 30000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [ready, loadAll]);

  const toggleOpen = async () => {
    if (!shop?.slug || toggling) return;

    setToggling(true);

    try {
      const response = await api.post(`/shops/${shop.slug}/toggle-open/`);
      const isOpen = response.data?.data?.is_open ?? !shop.is_open;

      setShop((previous: any) => ({
        ...previous,
        is_open: isOpen,
      }));

      toast.success(isOpen ? "🟢 Shop Open!" : "🔴 Shop Closed!");
    } catch {
      toast.error("Toggle nahi hua");
    } finally {
      setToggling(false);
    }
  };

  const handleOrder = async (orderNumber: string, nextStatus: string) => {
    try {
      await api.post(`/orders/${orderNumber}/status/`, {
        status: nextStatus,
      });

      toast.success(
        nextStatus === "CONFIRMED" ? "✅ Accepted!" : "❌ Rejected!"
      );

      loadAll();
    } catch {
      toast.error("Order update nahi hua");
    }
  };

  if (!ready || (loading && !shop && !noShop)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TopNav />

        <div className="max-w-md mx-auto px-4 pt-6 space-y-3">
          <div className="h-48 bg-gray-200 rounded-3xl animate-pulse" />

          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-20 bg-gray-200 rounded-2xl animate-pulse"
              />
            ))}
          </div>

          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-28 bg-gray-200 rounded-2xl animate-pulse"
            />
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
            Koi Shop Nahi
          </h2>

          <p className="text-gray-400 text-sm mb-8">
            QabiFly pe apni dukan register karein
          </p>

          <button
            onClick={() => router.push("/shopkeeper/shop/create")}
            className="grad text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-purple-200 inline-flex items-center gap-2 mx-auto"
          >
            <Plus size={20} />
            Naya Shop Banayein
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
        <div
          className={`rounded-3xl p-5 mb-5 text-white shadow-xl ${
            shop?.is_open
              ? "bg-gradient-to-br from-green-500 to-emerald-600"
              : "bg-gradient-to-br from-gray-500 to-gray-700"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white/60 text-xs uppercase tracking-wide mb-0.5">
                Aapki Shop
              </p>

              <h2 className="font-extrabold text-xl truncate">
                {shop?.name || "Shop"}
              </h2>

              {shop?.category?.name && (
                <p className="text-white/70 text-xs mt-0.5">
                  {shop.category.name}
                </p>
              )}

              <p className="text-white/60 text-xs mt-1">
                📍 {[shop?.village, shop?.district].filter(Boolean).join(", ")}
              </p>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
              <button
                onClick={loadAll}
                className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center"
              >
                <RefreshCw
                  size={15}
                  className={`text-white ${loading ? "animate-spin" : ""}`}
                />
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
              { label: "Pending", value: orders.length },
              { label: "Rating", value: shop?.average_rating || "—" },
              { label: "Orders", value: shop?.total_orders || 0 },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex-1 bg-white/20 rounded-xl p-2.5 text-center"
              >
                <p className="font-extrabold text-lg leading-none">
                  {stat.value}
                </p>
                <p className="text-white/70 text-[9px] mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {shop?.status && shop.status !== "ACTIVE" && (
            <div className="mt-3 bg-yellow-400/20 border border-yellow-300/30 rounded-xl px-3 py-2 flex items-center gap-2">
              <AlertCircle size={13} className="text-yellow-200" />
              <p className="text-yellow-100 text-xs">
                Status: <strong>{shop.status}</strong> — Approval pending
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: "📦 Products", href: "/shopkeeper/products" },
            { label: "📋 All Orders", href: "/shopkeeper/orders" },
            { label: "🏪 Shop Info", href: "/shopkeeper/shop" },
            { label: "💰 Earnings", href: "/wallet" },
          ].map((action) => (
            <button
              key={action.href}
              onClick={() => router.push(action.href)}
              className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md active:scale-95 transition-all text-left flex items-center justify-between"
            >
              <span className="font-bold text-sm text-gray-800">
                {action.label}
              </span>

              <ChevronRight size={14} className="text-gray-300" />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-gray-900 flex items-center gap-2">
            🔔 New Orders
            {orders.length > 0 && (
              <span className="text-xs text-white grad px-2 py-0.5 rounded-full">
                {orders.length}
              </span>
            )}
          </h2>

          <button
            onClick={() => router.push("/shopkeeper/orders")}
            className="text-xs text-purple-600 font-bold"
          >
            Sab →
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <Package size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Koi pending order nahi</p>
            <p className="text-xs text-gray-300 mt-1">Auto-refresh: 30 sec</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order: any) => (
              <div
                key={order.id || order.order_number}
                className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-purple-500"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-sm">
                    #{order.order_number}
                  </span>

                  <span className="font-extrabold text-purple-600">
                    {formatRupee(order.total_amount)}
                  </span>
                </div>

                <p className="text-xs text-gray-500">
                  👤 {order.buyer_name || "Customer"} ·{" "}
                  {order.total_items || 0} items
                </p>

                {order.delivery_address && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    📍 {order.delivery_address}
                  </p>
                )}

                <p className="text-xs text-gray-400 mt-0.5 mb-3">
                  {order.created_at ? timeAgo(order.created_at) : ""}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleOrder(order.order_number, "CANCELLED")
                    }
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-red-50 border border-red-200 text-red-500 text-xs font-bold rounded-xl"
                  >
                    <XCircle size={13} />
                    Reject
                  </button>

                  <button
                    onClick={() =>
                      handleOrder(order.order_number, "CONFIRMED")
                    }
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 grad text-white text-xs font-bold rounded-xl"
                  >
                    <CheckCircle size={13} />
                    Accept
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
