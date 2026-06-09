"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { productApi, cartApi } from "@/lib/api";
import { BotNav } from "@/components/layout/navbar";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { ArrowLeft, Star, Plus, Minus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { formatRupee } from "@/lib/utils";

export default function ProductDetailPage() {
  const { slug }    = useParams();
  const router      = useRouter();
  const { isAuth }  = useAuthStore();
  const { setCart } = useCartStore();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty,     setQty]     = useState(1);
  const [adding,  setAdding]  = useState(false);
  const [imgIdx,  setImgIdx]  = useState(0);
  const fetched = useRef(false);

  useEffect(() => {
    if (!slug || fetched.current) return;
    fetched.current = true;
    productApi.detail(slug as string)
      .then((r) => setProduct(r.data.data))
      .catch(() => toast.error("Product load nahi hua"))
      .finally(() => setLoading(false));
  }, [slug]);

  const addToCart = async () => {
    if (!isAuth) { router.push("/login"); return; }
    setAdding(true);
    try {
      const r = await cartApi.add(product.id, qty);
      setCart(r.data.data);
      toast.success(`${qty} item cart mein add ho gaya! 🛒`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Add nahi hua");
    } finally { setAdding(false); }
  };

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

  if (!product) return null;

  const images = product.images?.length > 0
    ? product.images.map((i: any) => i.image)
    : product.primary_image
    ? [product.primary_image]
    : [];

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Image */}
      <div className="relative bg-white">
        <div className="h-72 flex items-center justify-center bg-gray-50">
          {images.length > 0 ? (
            <img src={images[imgIdx]} alt={product.name}
              className="h-full w-full object-contain p-4" />
          ) : (
            <span className="text-8xl">📦</span>
          )}
        </div>
        <button onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center">
          <ArrowLeft size={18} className="text-gray-800" />
        </button>
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_: any, i: number) => (
              <button key={i} onClick={() => setImgIdx(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === imgIdx ? "grad w-5" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="max-w-md mx-auto px-4 pt-4">
        {/* Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
          <p className="text-xs text-purple-600 font-semibold mb-1">
            {product.category_name} · {product.shop_name}
          </p>
          <h1 className="font-extrabold text-gray-900 text-xl leading-tight mb-2">
            {product.name}
          </h1>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl font-extrabold text-purple-600">
              {formatRupee(product.discounted_price || product.price)}
            </span>
            {product.discount_percent > 0 && (
              <>
                <span className="text-gray-400 text-sm line-through">
                  {formatRupee(product.price)}
                </span>
                <span className="grad text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  -{product.discount_percent}%
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="bg-gray-100 text-gray-600 font-medium px-3 py-1 rounded-full text-xs">
              {product.unit}
            </span>
            {product.average_rating > 0 && (
              <div className="flex items-center gap-1">
                <Star size={13} className="text-yellow-400 fill-yellow-400" />
                <span className="font-semibold text-gray-700">{product.average_rating}</span>
                <span className="text-gray-400">({product.total_reviews})</span>
              </div>
            )}
            <span className={`text-xs font-bold ${
              product.is_in_stock ? "text-green-600" : "text-red-400"
            }`}>
              {product.is_in_stock ? `✓ In Stock (${product.stock})` : "✗ Out of Stock"}
            </span>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
            <h3 className="font-bold text-gray-900 mb-2">Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {product.description}
            </p>
          </div>
        )}

        {/* Shop Link */}
        <button
          onClick={() => router.push(`/shops/${product.shop_slug}`)}
          className="w-full bg-white rounded-2xl p-3 shadow-sm text-left flex items-center gap-3 mb-20"
        >
          <span className="text-2xl">🏪</span>
          <div>
            <p className="font-bold text-sm text-gray-900">{product.shop_name}</p>
            <p className="text-xs text-purple-600 font-semibold">Shop dekho →</p>
          </div>
        </button>
      </div>

      {/* Bottom CTA */}
      {product.is_in_stock && (
        <div className="fixed bottom-16 left-0 right-0 px-4 pb-3">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-3 flex items-center gap-3">
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                <button onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-7 h-7 bg-white rounded-full shadow-sm flex items-center justify-center">
                  <Minus size={14} className="text-gray-600" />
                </button>
                <span className="font-extrabold text-gray-900 w-6 text-center">{qty}</span>
                <button onClick={() => setQty(qty + 1)}
                  className="w-7 h-7 grad rounded-full flex items-center justify-center shadow-sm">
                  <Plus size={14} className="text-white" />
                </button>
              </div>
              <button
                onClick={addToCart}
                disabled={adding}
                className="flex-1 grad text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-purple-200"
              >
                {adding
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><ShoppingCart size={16} /> Cart Mein Daalo</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
      <BotNav />
    </div>
  );
}