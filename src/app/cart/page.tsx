"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { cartApi, orderApi, payApi } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, MapPin } from "lucide-react";
import { formatRupee } from "@/lib/utils";
import { toast } from "sonner";

export default function CartPage() {
  const router = useRouter();
  const { isAuth } = useAuthStore();
  const { cart, setCart } = useCartStore();
  const [loading,   setLoading]   = useState(true);
  const [placing,   setPlacing]   = useState(false);
  const [address,   setAddress]   = useState("");
  const [payMethod, setPayMethod] = useState<"COD" | "UPI">("COD");
  const [coupon,    setCoupon]    = useState("");
  const fetched = useRef(false);

  useEffect(() => {
    if (!isAuth) { setLoading(false); return; }
    if (fetched.current) return;
    fetched.current = true;

    cartApi.get()
      .then((r) => setCart(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuth]);

  const updateItem = async (itemId: string, qty: number) => {
    if (qty < 1) return removeItem(itemId);
    try {
      const r = await cartApi.update(itemId, qty);
      setCart(r.data.data);
    } catch { toast.error("Update nahi hua"); }
  };

  const removeItem = async (itemId: string) => {
    try {
      const r = await cartApi.remove(itemId);
      setCart(r.data.data);
      toast.success("Item remove ho gaya");
    } catch { toast.error("Remove nahi hua"); }
  };

  const placeOrder = async () => {
    const cleanAddress = address.trim();
    
    if (!cleanAddress) { 
      toast.error("Delivery address daalen"); 
      return; 
    }
    
    // 🔥 FIX: Backend validation bypass protection
    if (cleanAddress.length < 10) {
      toast.error("Address thoda bada likhein (gali, mohalla, landmark ke sath kam se kam 10 characters)");
      return;
    }
    
    if (!cart?.items?.length) { toast.error("Cart khaali hai"); return; }

    setPlacing(true);
    try {
      const r = await orderApi.place({
        delivery_address: cleanAddress,
        payment_method:   payMethod,
        shop:             cart.shop, // Ensure cart.shop handles the ID perfectly
        ...(coupon ? { coupon_code: coupon } : {}),
      });
      
      // 🔥 FIX: Django response standard check $.data.data.order_number
      const orderNum = r.data.data?.order_number || r.data.order_number;

      if (payMethod === "UPI") {
        try {
          const upiRes = await payApi.upiLink(orderNum);
          const link   = upiRes.data.data?.upi_link || upiRes.data.upi_link;
          if (link) window.open(link, "_blank");
        } catch {}
      }

      setCart(null);
      toast.success("✅ Order place ho gaya!");
      router.push(`/orders/${orderNum}`);
    } catch (e: any) {
      // Backend error format validation message handles cleanly here
      const backendError = e.response?.data?.message || e.response?.data?.delivery_address?.[0];
      toast.error(backendError || "Order place nahi hua");
    } finally { setPlacing(false); }
  };

  if (!isAuth) return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-16 text-center">
        <ShoppingCart size={56} className="text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">Login Karein</h2>
        <p className="text-gray-400 text-sm mb-5">Cart use karne ke liye login zaroori hai</p>
        <button onClick={() => router.push("/login")}
          className="grad text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-purple-200">
          Login Karein
        </button>
      </div>
      <BotNav />
    </div>
  );

  const isEmpty = !cart?.items?.length;

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 pb-44">

        <h1 className="text-xl font-extrabold text-gray-900 mb-4">
          Mera Cart 🛒
        </h1>

        {loading ? (
          <div className="space-y-3">
            {[1,2].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="text-center py-20">
            <ShoppingCart size={56} className="text-gray-200 mx-auto mb-4" />
            <h3 className="text-gray-500 font-bold text-lg mb-1">Cart Khaali Hai</h3>
            <p className="text-gray-400 text-sm mb-6">
              Shops se kuch add karein
            </p>
            <button onClick={() => router.push("/shops")}
              className="grad text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-purple-200">
              Shops Dekho →
            </button>
          </div>
        ) : (
          <>
            {cart?.shop_name && (
              <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
                <span className="text-purple-600 text-sm font-bold">
                  🏪 {cart.shop_name}
                </span>
              </div>
            )}

            {/* Items */}
            <div className="space-y-3 mb-4">
              {cart?.items.map((item: any) => (
                <div key={item.id}
                  className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {item.product_image
                      ? <img src={item.product_image} alt={item.product_name}
                             className="w-full h-full object-cover rounded-xl" />
                      : <span className="text-2xl">📦</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">
                      {item.product_name}
                    </p>
                    <p className="text-purple-600 font-extrabold text-sm mt-0.5">
                      {formatRupee(item.line_total)}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {formatRupee(item.unit_price)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => updateItem(item.id, item.quantity - 1)}
                      className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                      <Minus size={12} className="text-gray-600" />
                    </button>
                    <span className="font-bold text-sm w-5 text-center">
                      {item.quantity}
                    </span>
                    <button onClick={() => updateItem(item.id, item.quantity + 1)}
                      className="w-7 h-7 grad rounded-full flex items-center justify-center">
                      <Plus size={12} className="text-white" />
                    </button>
                    <button onClick={() => removeItem(item.id)}
                      className="w-7 h-7 bg-red-50 rounded-full flex items-center justify-center ml-1">
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={15} className="text-purple-500" />
                <h3 className="font-bold text-sm text-gray-900">Delivery Address *</h3>
              </div>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ghar ka address — gali, mohalla, landmark..."
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none"
              />
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
              <h3 className="font-bold text-sm text-gray-900 mb-3">Payment</h3>
              <div className="flex gap-3">
                {[
                  { k:"COD", e:"💵", l:"Cash on Delivery" },
                  { k:"UPI", e:"📱", l:"UPI Payment" },
                ].map((m) => (
                  <button key={m.k} onClick={() => setPayMethod(m.k as "COD" | "UPI")}
                    className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      payMethod === m.k
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-100 bg-white hover:border-gray-200"
                    }`}>
                    <span className="text-lg">{m.e}</span>
                    <span className="text-xs font-bold text-gray-900">{m.l}</span>
                  </button>
                ))}
              </div>
              {payMethod === "UPI" && (
                <p className="text-xs text-purple-600 mt-2 font-medium">
                  UPI ID: <span className="font-mono font-bold">6387403745@fam</span>
                </p>
              )}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-sm text-gray-900 mb-3">Summary</h3>
              {[
                { l: "Subtotal",  v: formatRupee(cart?.subtotal || "0") },
                { l: "Delivery",  v: formatRupee(cart?.delivery_charge || "0") },
              ].map((r) => (
                <div key={r.l} className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">{r.l}</span>
                  <span className="font-semibold">{r.v}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-2 flex justify-between">
                <span className="font-extrabold text-gray-900">Total</span>
                <span className="font-extrabold text-purple-600 text-lg">
                  {formatRupee(cart?.total_amount || "0")}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sticky Order Button */}
      {!isEmpty && !loading && (
        <div className="fixed bottom-16 left-0 right-0 px-4 pb-3 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
          <div className="max-w-md mx-auto">
            <button
              onClick={placeOrder}
              disabled={placing}
              className="w-full grad text-white font-extrabold py-4 rounded-2xl shadow-xl shadow-purple-300/40 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {placing
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><ArrowRight size={18} /> Order Place Karein — {formatRupee(cart?.total_amount || "0")}</>
              }
            </button>
          </div>
        </div>
      )}

      <BotNav />
    </div>
  );
}