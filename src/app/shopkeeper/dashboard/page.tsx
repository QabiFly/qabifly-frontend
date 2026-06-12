"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import {
  Package, Power, ChevronRight, Plus,
  CheckCircle, XCircle, Store, TrendingUp,
  RefreshCw, AlertCircle,
} from "lucide-react";
import { formatRupee, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

export default function ShopkeeperDashboard() {
  const router             = useRouter();
  const { user, isAuth }   = useAuthStore();
  const [shop,    setShop]    = useState<any>(null);
  const [orders,  setOrders]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling,setToggling]= useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (!isAuth) { router.push("/login"); return; }
    if (user?.role !== "SHOPKEEPER") { router.push("/"); return; }
    if (fetched.current) return;
    fetched.current = true;
    loadAll();
  }, [isAuth, user]);

  const loadAll = async () => {
    setLoading(true);
    try {
      // Shop mine
      const sr = await api.get("/shops/mine/");
      setShop(sr.data.data);

      // Pending orders
      const or = await api.get("/orders/shop/", { params: { status: "PENDING" } });
      const d = or.data.data?.results || or.data.data || [];
      setOrders(Array.isArray(d) ? d : []);
    } catch (e: any) {
      if (e.response?.status === 404) {
        setShop(null); // No shop yet
      } else {
        toast.error("Data load nahi hua");
      }
    } finally { setLoading(false); }
  };

  const toggleOpen = async () => {
    if (!shop) return;
    setToggling(true);
    try {
      const r = await api.post(`/shops/${shop.slug}/toggle-open/`);
      setShop((p: any) => ({ ...p, is_open: r.data.data?.is_open }));
      toast.success(r.data.data?.is_open ? "🟢 Shop Open!" : "🔴 Shop Closed!");
    } catch { toast.error("Status change nahi hua"); }
    finally { setToggling(false); }
  };

  const updateOrder = async (orderNum: string, status: string) => {
    try {
      await api.post(`/orders/${orderNum}/status/`, { status });
      toast.success(status === "CONFIRMED" ? "✅ Order accept!" : "❌ Order reject!");
      loadAll();
    } catch { toast.error("Update nahi hua"); }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />)}
      </div>
      <BotNav />
    </div>
  );

  // No shop yet
  if (!shop) return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-12 pb-24 text-center">
        <div className="w-24 h-24 grad rounded-3xl mx-auto mb-5 flex items-center justify-center shadow-xl shadow-purple-200">
          <Store size={40} className="text-white" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
          Apni Shop Banayein
        </h2>
        <p className="text-gray-400 text-sm mb-8 max-w-[240px] mx-auto leading-relaxed">
          QabiFly pe apni dukan register karein aur hazar customers tak pahunchein
        </p>
        <button onClick={() => router.push("/shopkeeper/shop/create")}
          className="grad text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-purple-200 flex items-center gap-2 mx-auto">
          <Plus size={20} /> Naya Shop Banayein
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
        <div className={`rounded-3xl p-5 mb-5 text-white shadow-xl ${
          shop.is_open
            ? "bg-gradient-to-r from-green-500 to-emerald-600"
            : "bg-gradient-to-r from-gray-500 to-gray-600"
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs mb-0.5">Aapki Shop</p>
              <h2 className="font-extrabold text-xl truncate">{shop.name}</h2>
              <p className="text-white/70 text-xs mt-1">
                {[shop.village, shop.district].filter(Boolean).join(", ")}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { fetched.current = false; loadAll(); }}
                className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <RefreshCw size={15} className="text-white" />
              </button>
              <button onClick={toggleOpen} disabled={toggling}
                className="flex items-center gap-1.5 bg-white/20 border border-white/30 text-white text-xs font-bold px-3 py-2 rounded-full disabled:opacity-60">
                <Power size={13} />
                {toggling ? "..." : shop.is_open ? "● Open" : "○ Closed"}
              </button>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {[
              { l: "Pending", v: orders.length     },
              { l: "Rating",  v: shop.average_rating || "—" },
              { l: "Reviews", v: shop.total_reviews || 0 },
            ].map(s => (
              <div key={s.l} className="flex-1 bg-white/20 rounded-xl p-2.5 text-center">
                <p className="font-extrabold text-lg leading-none">{s.v}</p>
                <p className="text-white/70 text-[10px] mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>

          {shop.status !== "ACTIVE" && (
            <div className="mt-3 flex items-center gap-2 bg-yellow-400/20 border border-yellow-300/30 rounded-xl px-3 py-2">
              <AlertCircle size={14} className="text-yellow-200" />
              <p className="text-yellow-100 text-xs font-medium">
                Shop approval pending — Admin review karega
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { l: "Products",   e: "📦", h: "/shopkeeper/products"  },
            { l: "All Orders", e: "📋", h: "/shopkeeper/orders"    },
            { l: "Earnings",   e: "💰", h: "/wallet"               },
          ].map(a => (
            <button key={a.h} onClick={() => router.push(a.h)}
              className="bg-white rounded-2xl p-3 shadow-sm text-center hover:shadow-md transition-all active:scale-95">
              <span className="text-2xl">{a.e}</span>
              <p className="text-xs font-bold text-gray-700 mt-1">{a.l}</p>
            </button>
          ))}
        </div>

        {/* Pending Orders */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-gray-900">
            🔔 New Orders ({orders.length})
          </h2>
          <button onClick={() => router.push("/shopkeeper/orders")}
            className="text-xs text-purple-600 font-bold">
            Sab dekho →
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <Package size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Abhi koi pending order nahi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o: any) => (
              <div key={o.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-sm">#{o.order_number}</span>
                  <span className="font-extrabold text-purple-600">{formatRupee(o.total_amount)}</span>
                </div>
                <p className="text-xs text-gray-500">👤 {o.buyer_name || "Customer"} · {o.total_items} items</p>
                <p className="text-xs text-gray-400 mt-0.5 mb-1">📍 {o.delivery_address}</p>
                <p className="text-xs text-gray-400 mb-3">⏰ {timeAgo(o.created_at)}</p>
                <div className="flex gap-2">
                  <button onClick={() => updateOrder(o.order_number, "CANCELLED")}
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-red-50 border border-red-200 text-red-500 text-xs font-bold rounded-xl">
                    <XCircle size={13} /> Reject
                  </button>
                  <button onClick={() => updateOrder(o.order_number, "CONFIRMED")}
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 grad text-white text-xs font-bold rounded-xl shadow-md">
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
