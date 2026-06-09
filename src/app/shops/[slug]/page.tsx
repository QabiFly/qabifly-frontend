"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { shopApi, productApi, cartApi } from "@/lib/api";
import { BotNav } from "@/components/layout/navbar";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { ArrowLeft, Star, MapPin, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { formatRupee } from "@/lib/utils";

export default function ShopDetailPage() {
  const { slug }     = useParams();
  const router       = useRouter();
  const { isAuth }   = useAuthStore();
  const { setCart }  = useCartStore();
  const [shop,     setShop]     = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [adding,   setAdding]   = useState<string | null>(null);
  const [qtys,     setQtys]     = useState<Record<string, number>>({});
  const fetched = useRef(false);

  useEffect(() => {
    if (!slug || fetched.current) return;
    fetched.current = true;

    const s = slug as string;

    // Pehle shop load karo
    shopApi.detail(s)
      .then((sr) => {
        const shopData = sr.data.data || sr.data;
        setShop(shopData);

        // Ab shop ki ID se products load karo — SLUG SE NAHI
        const shopId = shopData?.id;
        if (!shopId) { setLoading(false); return null; }

        return productApi.list(shopId);
      })
      .then((pr) => {
        if (!pr) return;
        const d =
          pr.data.data?.results ||
          pr.data.data ||
          pr.data?.results ||
          pr.data || [];
        setProducts(Array.isArray(d) ? d : []);
      })
      .catch((e) => {
        console.error("Shop/Product error:", e.response?.status);
        toast.error("Data load nahi hua");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const addToCart = async (product: any) => {
    if (!isAuth) { router.push("/login"); return; }
    setAdding(product.id);
    try {
      const r = await cartApi.add(product.id, 1);
      setCart(r.data.data);
      setQtys((q) => ({ ...q, [product.id]: 1 }));
      toast.success("Cart mein add ho gaya! 🛒");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Add nahi hua");
    } finally { setAdding(null); }
  };

  const changeQty = async (product: any, newQty: number) => {
    if (newQty < 1) {
      setQtys((q) => { const n = { ...q }; delete n[product.id]; return n; });
      return;
    }
    setQtys((q) => ({ ...q, [product.id]: newQty }));
    try {
      const r = await cartApi.add(product.id, newQty);
      setCart(r.data.data);
    } catch {}
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-44 bg-gray-200 animate-pulse" />
      <div className="max-w-md mx-auto px-4 py-4 space-y-3">
        <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
        {[1,2,3,4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );

  if (!shop) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center px-4">
        <span className="text-5xl">🏪</span>
        <p className="text-gray-500 mt-3 font-bold">Shop nahi mili</p>
        <button onClick={() => router.back()}
          className="text-purple-600 font-bold text-sm mt-2 block mx-auto">
          ← Wapas
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Banner */}
      <div className="relative">
        <div className={`h-44 ${shop.banner ? "" : "grad"}`}>
          {shop.banner && (
            <img src={shop.banner} alt={shop.name} className="w-full h-full object-cover" />
          )}
        </div>
        <button onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center">
          <ArrowLeft size={18} className="text-white" />
        </button>
      </div>

      <div className="max-w-md mx-auto px-4">
        {/* Shop Card */}
        <div className="bg-white rounded-2xl -mt-6 p-4 shadow-md mb-4">
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-purple-50 flex items-center justify-center flex-shrink-0 shadow-md border-2 border-white">
              {shop.logo
                ? <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                : <span className="text-3xl">🏪</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h1 className="font-extrabold text-gray-900 text-lg leading-tight truncate">
                  {shop.name}
                </h1>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                  shop.is_open ? "bg-green-50 text-green-600" : "bg-red-50 text-red-400"
                }`}>
                  {shop.is_open ? "● Open" : "● Closed"}
                </span>
              </div>
              {shop.category && (
                <p className="text-xs text-gray-400 mt-0.5">{shop.category.name}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                {shop.average_rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold">{shop.average_rating}</span>
                    <span>({shop.total_reviews})</span>
                  </div>
                )}
                {shop.village && (
                  <div className="flex items-center gap-1">
                    <MapPin size={12} className="text-gray-400" />
                    <span>{shop.village}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {shop.description && (
            <p className="text-xs text-gray-500 mt-3 leading-relaxed">
              {shop.description}
            </p>
          )}
        </div>

        {/* Products */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-gray-900">
            Products ({products.length})
          </h2>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <span className="text-4xl">📦</span>
            <p className="text-gray-400 text-sm mt-3">
              Is shop mein abhi koi product nahi
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p: any) => {
              const qty = qtys[p.id] || 0;
              return (
                <div key={p.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <button
                    onClick={() => router.push(`/products/${p.slug}`)}
                    className="w-full text-left block"
                  >
                    <div className="h-32 bg-gray-50 flex items-center justify-center overflow-hidden relative">
                      {p.primary_image
                        ? <img src={p.primary_image} alt={p.name} className="w-full h-full object-cover" />
                        : <span className="text-4xl">📦</span>
                      }
                      {p.discount_percent > 0 && (
                        <span className="absolute top-2 left-2 grad text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          -{p.discount_percent}%
                        </span>
                      )}
                    </div>
                  </button>
                  <div className="p-3">
                    <p className="font-bold text-gray-900 text-xs leading-tight line-clamp-2 mb-2">
                      {p.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-purple-600 text-sm">
                          {formatRupee(p.discounted_price || p.price)}
                        </span>
                        {p.discount_percent > 0 && (
                          <span className="text-[10px] text-gray-400 line-through block leading-tight">
                            {formatRupee(p.price)}
                          </span>
                        )}
                      </div>
                      {!p.is_in_stock ? (
                        <span className="text-[10px] text-red-400 font-bold">Out</span>
                      ) : qty === 0 ? (
                        <button
                          onClick={() => addToCart(p)}
                          disabled={adding === p.id}
                          className="w-8 h-8 grad rounded-full flex items-center justify-center shadow-sm disabled:opacity-60"
                        >
                          {adding === p.id
                            ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                            : <Plus size={16} className="text-white" />
                          }
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => changeQty(p, qty - 1)}
                            className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                            <Minus size={11} className="text-purple-600" />
                          </button>
                          <span className="text-xs font-extrabold text-gray-900 w-4 text-center">{qty}</span>
                          <button onClick={() => changeQty(p, qty + 1)}
                            className="w-6 h-6 grad rounded-full flex items-center justify-center">
                            <Plus size={11} className="text-white" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BotNav />
    </div>
  );
}