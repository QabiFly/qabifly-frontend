"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { shopApi } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import { Store, Plus, Power } from "lucide-react";
import { toast } from "sonner";

export default function ShopSettingsPage() {
  const router = useRouter();
  const { user, isAuth } = useAuthStore();
  const [shop,    setShop]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggling,setToggling]= useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (!isAuth || user?.role !== "SHOPKEEPER") { router.push("/"); return; }
    if (fetched.current) return;
    fetched.current = true;
    shopApi.mine()
      .then((r) => setShop(r.data.data))
      .catch(() => setShop(null))
      .finally(() => setLoading(false));
  }, [isAuth]);

  const toggleOpen = async () => {
    if (!shop) return;
    setToggling(true);
    try {
      const r = await shopApi.toggle(shop.slug);
      setShop((p: any) => ({ ...p, is_open: r.data.data?.is_open }));
      toast.success(r.data.data?.is_open ? "Shop Open!" : "Shop Closed!");
    } catch { toast.error("Status change nahi hua"); }
    finally { setToggling(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4">
        <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
      <BotNav />
    </div>
  );

  if (!shop) return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-10 text-center">
        <Store size={48} className="text-gray-200 mx-auto mb-4" />
        <h2 className="font-extrabold text-xl text-gray-900 mb-2">Koi Shop Nahi</h2>
        <p className="text-gray-400 text-sm mb-5">Admin se contact karein ya naya shop banayein</p>
        <button
          onClick={() => toast.info("Shop create feature coming soon")}
          className="grad text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-purple-200 inline-flex items-center gap-2"
        >
          <Plus size={16} /> Shop Create Karein
        </button>
      </div>
      <BotNav />
    </div>
  );

  const details = [
    { l: "Name",     v: shop.name },
    { l: "Category", v: shop.category?.name || "—" },
    { l: "Address",  v: shop.address },
    { l: "Village",  v: shop.village },
    { l: "District", v: shop.district },
    { l: "Approval", v: shop.is_approved ? "✅ Approved" : "⏳ Pending" },
    { l: "Status",   v: shop.is_open ? "🟢 Open" : "🔴 Closed" },
    { l: "Rating",   v: shop.average_rating ? `${shop.average_rating} ⭐` : "No reviews" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 pb-24">
        <h1 className="text-xl font-extrabold text-gray-900 mb-4">
          Shop Settings 🏪
        </h1>

        {/* Banner + Logo */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className={`h-32 ${shop.banner ? "" : "grad"}`}>
            {shop.banner && (
              <img src={shop.banner} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center overflow-hidden -mt-8 border-2 border-white shadow-md">
                {shop.logo ? (
                  <img src={shop.logo} alt="" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Store size={24} className="text-purple-400" />
                )}
              </div>
              <div className="flex-1 pt-1">
                <h2 className="font-extrabold text-gray-900">{shop.name}</h2>
                <p className="text-xs text-gray-400">{shop.category?.name}</p>
              </div>
              <button
                onClick={toggleOpen}
                disabled={toggling}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all disabled:opacity-60 ${
                  shop.is_open
                    ? "bg-green-50 border-green-200 text-green-600"
                    : "bg-red-50 border-red-200 text-red-500"
                }`}
              >
                <Power size={13} />
                {toggling ? "..." : shop.is_open ? "Open" : "Closed"}
              </button>
            </div>

            {/* Details */}
            <div className="space-y-0">
              {details.map((d) => (
                <div key={d.l}
                  className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-400 text-sm font-medium">{d.l}</span>
                  <span className="text-gray-900 font-semibold text-sm text-right max-w-[55%] leading-snug">
                    {d.v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => toast.info("Shop edit — admin se contact karein")}
          className="w-full grad text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-200"
        >
          Shop Info Edit Karein
        </button>
      </div>
      <BotNav />
    </div>
  );
}