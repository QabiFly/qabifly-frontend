"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, cartApi } from "@/lib/api";
import { BotNav } from "@/components/layout/navbar";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import {
  ArrowLeft, Star, Plus, Minus,
  ShoppingCart, Package, ChevronRight,
  Share2, Heart,
} from "lucide-react";
import { toast } from "sonner";
import { formatRupee } from "@/lib/utils";

export default function ProductDetailPage() {
  const { slug }    = useParams();
  const router      = useRouter();
  const { isAuth }  = useAuthStore();
  const { setCart } = useCartStore();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [qty,     setQty]     = useState(1);
  const [adding,  setAdding]  = useState(false);
  const [imgIdx,  setImgIdx]  = useState(0);
  const [liked,   setLiked]   = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (!slug || fetched.current) return;
    fetched.current = true;

    api.get(`/products/${slug}/`)
      .then((r) => {
        const data = r.data.data || r.data;
        setProduct(data);
      })
      .catch((e) => {
        console.error("Product error:", e.response?.status, e.response?.data);
        setError(`Error ${e.response?.status}: ${
          e.response?.data?.message || e.message
        }`);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const addToCart = async () => {
    if (!isAuth) { router.push("/login"); return; }
    if (!product) return;
    setAdding(true);
    try {
      const r = await cartApi.add(product.id, qty);
      setCart(r.data.data);
      toast.success(`${qty}x ${product.name} cart mein! 🛒`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Cart mein add nahi hua");
    } finally { setAdding(false); }
  };

  // ── Loading ───────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-72 bg-gray-200 animate-pulse" />
      <div className="max-w-md mx-auto px-4 py-4 space-y-3">
        <div className="h-8 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-24 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────
  if (error || !product) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-xs">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="font-extrabold text-xl text-gray-900 mb-2">
          Product Nahi Mila
        </h2>
        <p className="text-gray-400 text-sm mb-2">{error}</p>
        <p className="text-xs text-gray-300 font-mono mb-5">
          /products/{slug}/
        </p>
        <button onClick={() => router.back()}
          className="grad text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-purple-200">
          ← Wapas
        </button>
      </div>
    </div>
  );

  const images = product.images?.length > 0
    ? product.images.map((i: any) => i.image || i)
    : product.primary_image
    ? [product.primary_image]
    : [];

  // Stock available check — stock > 0 hona chahiye
  const inStock = product.stock > 0 || product.is_in_stock === true;

  // ── Main UI ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 pb-32">

      {/* ── Image Gallery ──────────────────────────────────────── */}
      <div className="relative bg-white">
        <div className="h-72 flex items-center justify-center bg-gray-50 overflow-hidden">
          {images.length > 0
            ? <img src={images[imgIdx]} alt={product.name}
                className="h-full w-full object-contain p-4" />
            : <div className="flex flex-col items-center gap-2">
                <Package size={64} className="text-gray-200" />
                <p className="text-xs text-gray-300">No image</p>
              </div>
          }
        </div>

        {/* Back + Actions */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button onClick={() => router.back()}
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: product.name, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copy ho gaya!");
                }
              }}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
              <Share2 size={16} className="text-gray-700" />
            </button>
            <button onClick={() => setLiked(!liked)}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
              <Heart size={16}
                className={liked ? "text-red-500 fill-red-500" : "text-gray-700"} />
            </button>
          </div>
        </div>

        {/* Image dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_: any, i: number) => (
              <button key={i} onClick={() => setImgIdx(i)}
                className={`h-2 rounded-full transition-all ${
                  i === imgIdx ? "grad w-5" : "w-2 bg-gray-300"
                }`} />
            ))}
          </div>
        )}
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">

        {/* ── Main Info Card ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">

          {/* Category + Shop */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {product.category_name && (
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                {product.category_name}
              </span>
            )}
            <button onClick={() => router.push(`/shops/${product.shop_slug}`)}
              className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex items-center gap-0.5 hover:bg-gray-200 transition-all">
              🏪 {product.shop_name}
              <ChevronRight size={10} />
            </button>
          </div>

          {/* Name */}
          <h1 className="font-extrabold text-gray-900 text-xl leading-tight mb-3">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-end gap-3 mb-3">
            <span className="text-3xl font-extrabold text-purple-600">
              {formatRupee(product.discounted_price || product.price)}
            </span>
            {product.discount_percent > 0 && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-gray-400 text-sm line-through">
                  {formatRupee(product.price)}
                </span>
                <span className="grad text-white text-xs font-extrabold px-2 py-0.5 rounded-full">
                  {product.discount_percent}% OFF
                </span>
              </div>
            )}
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-3 flex-wrap">
            {product.unit && (
              <span className="bg-gray-100 text-gray-600 font-semibold px-3 py-1 rounded-full text-xs">
                📦 {product.unit}
              </span>
            )}
            {product.average_rating > 0 && (
              <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span className="font-bold text-xs text-yellow-700">
                  {product.average_rating}
                </span>
                <span className="text-gray-400 text-xs">
                  ({product.total_reviews})
                </span>
              </div>
            )}
            {/* Stock status — stock > 0 check */}
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              inStock
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-500"
            }`}>
              {inStock
                ? `✓ In Stock (${product.stock})`
                : "✗ Out of Stock"
              }
            </span>
          </div>
        </div>

        {/* ── Description ────────────────────────────────────────── */}
        {product.description && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-extrabold text-gray-900 mb-2">
              Description
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {product.description}
            </p>
          </div>
        )}

        {/* ── Shop Card ───────────────────────────────────────────── */}
        <button onClick={() => router.push(`/shops/${product.shop_slug}`)}
          className="w-full bg-white rounded-2xl p-4 shadow-sm text-left flex items-center gap-3 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center overflow-hidden flex-shrink-0">
            {product.shop_logo
              ? <img src={product.shop_logo} alt="" className="w-full h-full object-cover rounded-xl" />
              : <span className="text-xl">🏪</span>
            }
          </div>
          <div className="flex-1">
            <p className="font-extrabold text-sm text-gray-900">
              {product.shop_name}
            </p>
            <p className="text-xs text-purple-600 font-semibold mt-0.5">
              Aur products dekhein →
            </p>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </button>

      </div>

      {/* ── Bottom Add to Cart ─────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 shadow-xl">
        <div className="max-w-md mx-auto flex items-center gap-3">

          {/* Qty selector */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
            <button onClick={() => setQty(Math.max(1, qty - 1))}
              className="w-7 h-7 bg-white rounded-lg shadow-sm flex items-center justify-center active:scale-95 transition-all">
              <Minus size={14} className="text-gray-600" />
            </button>
            <span className="font-extrabold text-gray-900 text-sm w-6 text-center">
              {qty}
            </span>
            <button
              onClick={() => setQty(Math.min(product.stock || 999, qty + 1))}
              className="w-7 h-7 grad rounded-lg flex items-center justify-center shadow-sm active:scale-95 transition-all">
              <Plus size={14} className="text-white" />
            </button>
          </div>

          {/* Add to cart / Out of stock */}
          {inStock ? (
            <button onClick={addToCart} disabled={adding}
              className="flex-1 grad text-white font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-purple-200 active:scale-[0.98] transition-all">
              {adding ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingCart size={18} />
                  Cart Mein Daalo —{" "}
                  {formatRupee(
                    parseFloat(product.discounted_price || product.price) * qty
                  )}
                </>
              )}
            </button>
          ) : (
            <div className="flex-1 bg-gray-100 text-gray-400 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm">
              Out of Stock
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
