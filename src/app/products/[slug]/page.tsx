// src/app/products/[slug]/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, cartApi } from "@/lib/api";
import { BotNav } from "@/components/layout/navbar";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import {
  ArrowLeft, Star, Plus, Minus,
  ShoppingCart, Package,
} from "lucide-react";
import { toast } from "sonner";
import { formatRupee } from "@/lib/utils";

export default function ProductDetailPage() {
  const params  = useParams();
  const slug    = params?.slug as string;
  const router  = useRouter();
  const { isAuth }  = useAuthStore();
  const { setCart } = useCartStore();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [qty,     setQty]     = useState(1);
  const [adding,  setAdding]  = useState(false);
  const [imgIdx,  setImgIdx]  = useState(0);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    setError("");

    api.get(`/products/${slug}/`)
      .then((r) => {
        const data = r.data?.data || r.data;
        if (!data) {
          setError("Product data nahi aaya");
          return;
        }
        setProduct(data);
      })
      .catch((e) => {
        const status = e.response?.status;
        if (status === 404) setError("Yeh product available nahi hai");
        else if (status === 401) setError("Login karein product dekhne ke liye");
        else setError(`Error ${status || "unknown"}: ${e.message}`);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const addToCart = async () => {
    if (!isAuth) {
      toast.error("Cart ke liye login karein");
      router.push("/login");
      return;
    }
    if (!product?.id) return;
    setAdding(true);
    try {
      const r = await cartApi.add(product.id, qty);
      setCart(r.data.data);
      toast.success(`✅ ${product.name} cart mein!`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Cart mein add nahi hua");
    } finally {
      setAdding(false);
    }
  };

  // Loading
  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-72 bg-gray-200 animate-pulse" />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        <div className="h-8 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-24 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    </div>
  );

  // Error
  if (error || !product) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-xs w-full">
        <Package size={64} className="text-gray-200 mx-auto mb-4" />
        <h2 className="font-extrabold text-xl text-gray-900 mb-2">
          {error || "Product Nahi Mila"}
        </h2>
        <p className="text-xs text-gray-300 font-mono mb-5">/products/{slug}</p>
        <button
          onClick={() => router.back()}
          className="grad text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-purple-200"
        >
          ← Wapas
        </button>
      </div>
    </div>
  );

  // Images
  const images = [
    ...(product.images?.map((i: any) => i.image).filter(Boolean) || []),
  ];
  if (product.primary_image && !images.includes(product.primary_image)) {
    images.unshift(product.primary_image);
  }

  const inStock = (product.stock || 0) > 0 || product.is_in_stock === true;
  const price   = parseFloat(String(product.discounted_price || product.price || 0));
  const total   = (price * qty).toFixed(2);

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Image */}
      <div className="relative bg-white">
        <div className="h-72 bg-gray-50 flex items-center justify-center overflow-hidden">
          {images.length > 0 ? (
            <img
              src={images[imgIdx]}
              alt={product.name}
              className="h-full w-full object-contain p-4"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "";
              }}
            />
          ) : (
            <Package size={80} className="text-gray-200" />
          )}
        </div>

        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </button>

        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                className={`h-2 rounded-full transition-all ${
                  i === imgIdx ? "grad w-5" : "w-2 bg-gray-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        {/* Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex gap-2 mb-2 flex-wrap">
            {product.category_name && (
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                {product.category_name}
              </span>
            )}
            {product.shop_name && (
              <button
                onClick={() => router.push(`/shops/${product.shop_slug}`)}
                className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"
              >
                🏪 {product.shop_name}
              </button>
            )}
          </div>

          <h1 className="font-extrabold text-gray-900 text-xl leading-tight mb-3">
            {product.name}
          </h1>

          <div className="flex items-end gap-3 mb-3">
            <span className="text-3xl font-extrabold text-purple-600">
              {formatRupee(product.discounted_price || product.price)}
            </span>
            {product.discount_percent > 0 && (
              <>
                <span className="text-gray-400 text-sm line-through mb-1">
                  {formatRupee(product.price)}
                </span>
                <span className="grad text-white text-xs font-extrabold px-2 py-0.5 rounded-full mb-1">
                  {product.discount_percent}% OFF
                </span>
              </>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
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
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                inStock
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-500"
              }`}
            >
              {inStock ? `✓ In Stock (${product.stock})` : "✗ Out of Stock"}
            </span>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-extrabold text-gray-900 mb-2">Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {product.description}
            </p>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 shadow-xl z-40">
        <div className="max-w-md mx-auto flex items-center gap-3">
          {inStock ? (
            <>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 bg-white rounded-lg shadow-sm flex items-center justify-center"
                >
                  <Minus size={14} className="text-gray-600" />
                </button>
                <span className="font-extrabold text-gray-900 text-sm w-6 text-center">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                  className="w-7 h-7 grad rounded-lg flex items-center justify-center shadow-sm"
                >
                  <Plus size={14} className="text-white" />
                </button>
              </div>
              <button
                onClick={addToCart}
                disabled={adding}
                className="flex-1 grad text-white font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-purple-200"
              >
                {adding ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShoppingCart size={18} />
                    Cart Mein — {formatRupee(total)}
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="flex-1 bg-gray-100 text-gray-400 font-bold py-3.5 rounded-xl flex items-center justify-center">
              Out of Stock
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
