// src/app/products/[slug]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { ArrowLeft, Star, Plus, Minus, ShoppingCart, Package, Store, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatRupee } from "@/lib/utils";

// Types
interface Review {
  id: number;
  rating: number;
  comment?: string;
  user?: {
    virtual_name?: string;
    full_name?: string;
  };
}

interface ProductImage {
  image: string;
}

interface Product {
  id: number;
  slug?: string;
  name: string;
  description?: string;
  price: number;
  discounted_price?: number;
  discount_percent?: number;
  stock?: number;
  is_in_stock?: boolean;
  unit?: string;
  category_name?: string;
  shop_name?: string;
  shop_slug?: string;
  primary_image?: string;
  images?: (string | ProductImage)[];
  average_rating?: number;
  total_reviews?: number;
  reviews?: Review[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { isAuth } = useAuthStore();
  const { setCart } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  // Fetch product on slug change
  useEffect(() => {
    if (!slug) {
      setError("Invalid product URL");
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      setLoading(true);
      setError("");
      setQuantity(1);
      setCurrentImageIndex(0);
      setImageErrors({});

      try {
        const response = await api.get(`/products/${encodeURIComponent(slug)}/`);
        const data = response.data?.data || response.data;
        
        if (data && (data.id || data.name)) {
          setProduct(data);
        } else {
          setError("Product data is invalid");
        }
      } catch (err: any) {
        const status = err.response?.status;
        if (status === 404) {
          setError("Product not found");
        } else if (status === 401) {
          setError("Please login to view this product");
        } else {
          setError(`Failed to load product (${status || "network error"})`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const addToCart = useCallback(async () => {
    if (!isAuth) {
      toast.error("Please login first");
      router.push("/login");
      return;
    }

    if (!product?.id) {
      toast.error("Product information missing");
      return;
    }

    const maxStock = product.stock ?? 0;
    if (quantity > maxStock && maxStock > 0) {
      toast.error(`Only ${maxStock} items in stock`);
      return;
    }

    setAdding(true);
    try {
      // Using the correct cart endpoint from API spec
      const response = await api.post("/cart/add/", {
        product_id: product.id,
        quantity: quantity,
      });
      
      const updatedCart = response.data?.data || response.data;
      if (updatedCart) {
        setCart(updatedCart);
      }
      
      toast.success(`✅ Added ${quantity}x ${product.name} to cart!`);
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.error || "Failed to add to cart";
      toast.error(message);
    } finally {
      setAdding(false);
    }
  }, [isAuth, product, quantity, router, setCart]);

  const updateQuantity = (delta: number) => {
    const newQty = quantity + delta;
    const maxStock = product?.stock ?? 99;
    if (newQty >= 1 && newQty <= maxStock) {
      setQuantity(newQty);
    }
  };

  // Build image array
  const images: string[] = [];
  if (product?.primary_image) images.push(product.primary_image);
  if (product?.images) {
    product.images.forEach((img) => {
      const url = typeof img === "string" ? img : img.image;
      if (url && !images.includes(url)) images.push(url);
    });
  }

  const inStock = (product?.stock ?? 0) > 0 || product?.is_in_stock === true;
  const displayPrice = parseFloat(String(product?.discounted_price ?? product?.price ?? 0));
  const totalPrice = displayPrice * quantity;

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TopNav />
        <div className="h-64 bg-gray-200 animate-pulse" />
        <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
          {[80, 40, 60, 100].map((h, i) => (
            <div key={i} style={{ height: h }} className="bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
        <BotNav />
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <TopNav />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <AlertCircle size={64} className="text-red-200 mx-auto mb-4" />
            <h2 className="font-extrabold text-xl text-gray-900 mb-2">
              {error || "Product Not Found"}
            </h2>
            <p className="text-xs text-gray-300 font-mono mb-5">/products/{slug}</p>
            <button
              onClick={() => router.back()}
              className="grad text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-purple-200"
            >
              ← Go Back
            </button>
          </div>
        </div>
        <BotNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <TopNav />
      
      {/* Image Gallery */}
      <div className="relative bg-white">
        <div className="h-72 bg-gray-50 flex items-center justify-center">
          {images.length > 0 && !imageErrors[currentImageIndex] ? (
            <img
              src={images[currentImageIndex]}
              alt={product.name}
              className="h-full w-full object-contain p-4"
              onError={() =>
                setImageErrors((prev) => ({ ...prev, [currentImageIndex]: true }))
              }
            />
          ) : (
            <Package size={80} className="text-gray-200" />
          )}
        </div>
        
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
        
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentImageIndex ? "grad w-5" : "w-2 bg-gray-300"
                }`}
                aria-label={`View image ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-3 pb-4">
        {/* Main Info Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex gap-2 mb-2 flex-wrap">
            {product.category_name && (
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                {product.category_name}
              </span>
            )}
            {product.shop_name && product.shop_slug && (
              <button
                onClick={() => router.push(`/shops/${product.shop_slug}`)}
                className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1"
              >
                <Store size={10} /> {product.shop_name}
              </button>
            )}
          </div>

          <h1 className="font-extrabold text-gray-900 text-xl leading-tight mb-3">
            {product.name}
          </h1>

          <div className="flex items-end gap-3 mb-3 flex-wrap">
            <span className="text-3xl font-extrabold text-purple-600">
              {formatRupee(displayPrice)}
            </span>
            {product.discount_percent && product.discount_percent > 0 && (
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
            {product.average_rating && product.average_rating > 0 && (
              <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span className="font-bold text-xs text-yellow-700">
                  {product.average_rating.toFixed(1)}
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
              {inStock
                ? `✓ In Stock ${product.stock ? `(${product.stock})` : ""}`
                : "✗ Out of Stock"}
            </span>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-extrabold text-gray-900 mb-2">Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}

        {/* Reviews Section */}
        {product.reviews && product.reviews.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-extrabold text-gray-900 mb-3">
              Reviews ({product.total_reviews})
            </h3>
            <div className="space-y-3">
              {product.reviews.slice(0, 3).map((review) => {
                const reviewerName =
                  review.user?.virtual_name || review.user?.full_name || "User";
                return (
                  <div
                    key={review.id}
                    className="flex items-start gap-2 pb-3 border-b border-gray-50 last:border-0"
                  >
                    <div className="w-8 h-8 grad rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {reviewerName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-gray-900">
                          {reviewerName}
                        </span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={10}
                              className={
                                star <= review.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-200"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {product.total_reviews && product.total_reviews > 3 && (
                <button
                  onClick={() => router.push(`/products/${slug}/reviews`)}
                  className="text-xs text-purple-600 font-bold mt-2 block text-center"
                >
                  See all {product.total_reviews} reviews →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 shadow-xl z-40">
        <div className="max-w-md mx-auto flex items-center gap-3">
          {inStock ? (
            <>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
                <button
                  onClick={() => updateQuantity(-1)}
                  disabled={quantity <= 1}
                  className="w-7 h-7 bg-white rounded-lg shadow-sm flex items-center justify-center disabled:opacity-50"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} className="text-gray-600" />
                </button>
                <span className="font-extrabold text-gray-900 text-sm w-6 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => updateQuantity(1)}
                  disabled={product.stock ? quantity >= product.stock : false}
                  className="w-7 h-7 grad rounded-lg flex items-center justify-center disabled:opacity-50"
                  aria-label="Increase quantity"
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
                    Add — {formatRupee(totalPrice)}
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
      
      <BotNav />
    </div>
  );
}
