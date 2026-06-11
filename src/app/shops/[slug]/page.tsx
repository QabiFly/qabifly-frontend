"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, cartApi } from "@/lib/api";
import { BotNav } from "@/components/layout/navbar";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import {
  ArrowLeft, Star, MapPin, Plus, Minus,
  Clock, Phone, ShoppingBag, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { formatRupee } from "@/lib/utils";

export default function ShopDetailPage() {
  const { slug }    = useParams();
  const router      = useRouter();
  const { isAuth }  = useAuthStore();
  const { setCart } = useCartStore();

  const [shop,     setShop]     = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [adding,   setAdding]   = useState<string | null>(null);
  const [qtys,     setQtys]     = useState<Record<string, number>>({});
  const [selCat,   setSelCat]   = useState("all");
  const fetched = useRef(false);

  useEffect(() => {
    if (!slug || fetched.current) return;
    fetched.current = true;
    loadAll();
  }, [slug]);

  const loadAll = async () => {
    try {
      // Shop detail
      const sr      = await api.get(`/shops/${slug}/`);
      const shopData = sr.data.data;
      setShop(shopData);

      // Products — shop UUID se
      try {
        const pr = await api.get("/products/", {
          params: { shop: shopData.id }
        });
        const d = pr.data.data?.results
               || pr.data.data
               || pr.data?.results
               || [];
        setProducts(Array.isArray(d) ? d : []);
      } catch (pe: any) {
        console.error("Products error:", pe.response?.status, pe.response?.data);
        setProducts([]);
      }
    } catch {
      toast.error("Shop load nahi hua");
    } finally {
      setLoading(false);
    }
  };

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

  const updateQty = async (product: any, qty: number) => {
    if (qty < 1) {
      setQtys((q) => { const n = { ...q }; delete n[product.id]; return n; });
      return;
    }
    try {
      await cartApi.add(product.id, qty);
      setQtys((q) => ({ ...q, [product.id]: qty }));
    } catch {}
  };

  // Category tabs
  const cats = ["all", ...Array.from(new Set(
    products.map((p: any) => p.category_name).filter(Boolean)
  ))];

  const filtered = selCat === "all"
    ? products
    : products.filter((p: any) => p.category_name === selCat);

  // ── Loading skeleton ──────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-52 bg-gradient-to-r from-purple-300 to-blue-300 animate-pulse" />
      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        <div className="h-28 bg-gray-200 rounded-2xl animate-pulse -mt-8" />
        <div className="flex gap-2">
          {[1,2,3].map((i) => (
            <div key={i} className="h-7 w-20 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map((i) => (
            <div key={i} className="h-52 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );

  if (!shop) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center px-6">
        <div className="text-6xl mb-4">🏪</div>
        <h2 className="font-extrabold text-xl text-gray-900 mb-2">Shop Nahi Mili</h2>
        <button onClick={() => router.back()}
          className="grad text-white font-bold px-5 py-2.5 rounded-xl shadow-md mt-2">
          ← Wapas
        </button>
      </div>
    </div>
  );

  // ── Main UI ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* ── Banner ─────────────────────────────────────────────── */}
      <div className="relative">
        <div className={`h-52 ${shop.banner ? "" : "grad"}`}>
          {shop.banner && (
            <img src={shop.banner} alt={shop.name}
              className="w-full h-full object-cover" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Back button */}
        <button onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center">
          <ArrowLeft size={18} className="text-white" />
        </button>

        {/* Open/Closed Badge */}
        <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold backdrop-blur-sm ${
          shop.is_open
            ? "bg-green-500/90 text-white"
            : "bg-red-500/90 text-white"
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${shop.is_open ? "bg-white animate-pulse" : "bg-white"}`} />
          {shop.is_open ? "Open Now" : "Closed"}
        </div>
      </div>

      {/* ── Shop Info Card ──────────────────────────────────────── */}
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-3xl -mt-8 p-4 shadow-xl mb-4 relative">

          <div className="flex items-start gap-3">
            {/* Logo */}
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-purple-50 flex items-center justify-center flex-shrink-0 border-2 border-white shadow-lg -mt-8">
              {shop.logo
                ? <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                : <ShoppingBag size={28} className="text-purple-400" />
              }
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <h1 className="font-extrabold text-gray-900 text-lg leading-tight">
                {shop.name}
              </h1>
              {shop.category && (
                <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                  {shop.category.name}
                </span>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 flex-wrap">
            {shop.average_rating > 0 && (
              <div className="flex items-center gap-1">
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                <span className="font-extrabold text-sm text-gray-900">
                  {shop.average_rating}
                </span>
                <span className="text-gray-400 text-xs">({shop.total_reviews})</span>
              </div>
            )}
            {shop.village && (
              <div className="flex items-center gap-1 text-gray-500 text-xs">
                <MapPin size={12} />
                <span>{shop.village}{shop.district ? `, ${shop.district}` : ""}</span>
              </div>
            )}
            {(shop.opening_time || shop.closing_time) && (
              <div className="flex items-center gap-1 text-gray-500 text-xs">
                <Clock size={12} />
                <span>{shop.opening_time} – {shop.closing_time}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {shop.description && shop.description !== "N.A" && (
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              {shop.description}
            </p>
          )}
        </div>

        {/* ── Products Section ─────────────────────────────────── */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-gray-900 text-lg">
            Products
            <span className="text-gray-400 font-medium text-sm ml-2">
              ({products.length})
            </span>
          </h2>
        </div>

        {/* Category Filter Tabs */}
        {cats.length > 2 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
            {cats.map((c) => (
              <button key={c} onClick={() => setSelCat(c)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  selCat === c
                    ? "grad text-white border-transparent"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}>
                {c === "all" ? "🌟 All" : c}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <div className="text-5xl mb-3">📦</div>
            <p className="text-gray-500 font-bold">Koi product nahi</p>
            <p className="text-gray-400 text-sm mt-1">
              {products.length === 0
                ? "Backend mein products add karein"
                : "Is category mein koi product nahi"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((p: any) => {
              const qty = qtys[p.id] || 0;
              return (
                <div key={p.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200">

                  {/* Product Image */}
                  <button onClick={() => router.push(`/products/${p.slug}`)}
                    className="w-full relative block">
                    <div className="h-36 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                      {p.primary_image
                        ? <img src={p.primary_image} alt={p.name}
                            className="w-full h-full object-cover transition-transform hover:scale-105" />
                        : <span className="text-5xl">📦</span>
                      }
                    </div>
                    {/* Discount Badge */}
                    {p.discount_percent > 0 && (
                      <div className="absolute top-2 left-2 grad text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow">
                        -{p.discount_percent}%
                      </div>
                    )}
                    {/* Out of Stock */}
                    {!p.is_in_stock && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-t-2xl">
                        <span className="text-white text-xs font-extrabold bg-black/60 px-3 py-1 rounded-full">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </button>

                  {/* Product Info */}
                  <div className="p-3">
                    <p className="font-bold text-gray-900 text-xs leading-tight line-clamp-2 mb-1 min-h-[2.5rem]">
                      {p.name}
                    </p>

                    {/* Unit + Category */}
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-[10px] bg-purple-50 text-purple-600 font-semibold px-1.5 py-0.5 rounded-full">
                        {p.unit}
                      </span>
                      {p.category_name && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 font-medium px-1.5 py-0.5 rounded-full truncate">
                          {p.category_name}
                        </span>
                      )}
                    </div>

                    {/* Price + Cart */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-extrabold text-purple-600 text-sm">
                          {formatRupee(p.discounted_price || p.price)}
                        </p>
                        {p.discount_percent > 0 && (
                          <p className="text-[10px] text-gray-400 line-through leading-none">
                            {formatRupee(p.price)}
                          </p>
                        )}
                      </div>

                      {p.is_in_stock ? (
                        qty === 0 ? (
                          <button onClick={() => addToCart(p)}
                            disabled={adding === p.id}
                            className="w-8 h-8 grad rounded-xl flex items-center justify-center shadow-md shadow-purple-200 disabled:opacity-60 active:scale-95 transition-all">
                            {adding === p.id
                              ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : <Plus size={16} className="text-white" />
                            }
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 bg-purple-50 rounded-xl px-1.5 py-1">
                            <button onClick={() => updateQty(p, qty - 1)}
                              className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm">
                              <Minus size={11} className="text-purple-600" />
                            </button>
                            <span className="text-xs font-extrabold text-purple-700 w-4 text-center">
                              {qty}
                            </span>
                            <button onClick={() => updateQty(p, qty + 1)}
                              className="w-6 h-6 grad rounded-lg flex items-center justify-center shadow-sm">
                              <Plus size={11} className="text-white" />
                            </button>
                          </div>
                        )
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
