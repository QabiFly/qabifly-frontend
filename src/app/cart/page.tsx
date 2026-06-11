"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { cartApi, orderApi, payApi } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import {
  ShoppingCart, Minus, Plus, Trash2,
  ArrowRight, MapPin, Store,
} from "lucide-react";
import { formatRupee } from "@/lib/utils";
import { toast } from "sonner";

export default function CartPage() {
  const router              = useRouter();
  const { isAuth }          = useAuthStore();
  const { cart, setCart }   = useCartStore();
  const [loading,  setLoading]  = useState(true);
  const [placing,  setPlacing]  = useState(false);
  const [address,  setAddress]  = useState("");
  const [payment,  setPayment]  = useState<"COD"|"UPI">("COD");
  const [coupon,   setCoupon]   = useState("");
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
      toast.success("Item hata diya");
    } catch { toast.error("Remove nahi hua"); }
  };

  const placeOrder = async () => {
    if (!address.trim()) { toast.error("Delivery address daalen"); return; }
    if (!cart?.items?.length) { toast.error("Cart khaali hai"); return; }
    setPlacing(true);
    try {
      const r = await orderApi.place({
        delivery_address: address,
        payment_method:   payment,
        shop:             cart.shop,
        ...(coupon ? { coupon_code: coupon } : {}),
      });
      const orderNum = r.data.data?.order_number;

      if (payment === "UPI") {
        try {
          const upiRes = await payApi.upiLink(orderNum);
          const link   = upiRes.data.data?.upi_link;
          if (link) window.open(link, "_blank");
        } catch {}
      }

      setCart(null);
      toast.success("✅ Order place ho gaya!");
      router.push(`/orders/${orderNum}`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Order place nahi hua");
    } finally { setPlacing(false); }
  };

  // Not logged in
  if (!isAuth) return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-20 text-center">
        <ShoppingCart size={64} className="text-gray-200 mx-auto mb-5" />
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">
          Login Karein
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Cart use karne ke liye login karein
        </p>
        <button onClick={() => router.push("/login")}
          className="grad text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-purple-200">
          Login Karein
        </button>
      </div>
      <BotNav />
    </div>
  );

  const isEmpty = !cart?.items?.length;
  const total   = cart?.total_amount || cart?.subtotal || "0";

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 pb-48">

        <h1 className="text-xl font-extrabold text-gray-900 mb-4">
          Mera Cart 🛒
        </h1>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="text-center py-20">
            <ShoppingCart size={64} className="text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-extrabold text-gray-500 mb-2">
              Cart Khaali Hai
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Shops se products add karein
            </p>
            <button onClick={() => router.push("/shops")}
              className="grad text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-purple-200">
              Shops Dekho →
            </button>
          </div>
        ) : (
          <>
            {/* Shop name */}
            {cart?.shop_name && (
              <button onClick={() => router.push(`/shops/${cart.shop}`)}
                className="w-full bg-purple-50 border border-purple-100 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
                <Store size={15} className="text-purple-500" />
                <span className="text-sm font-bold text-purple-700">
                  {cart.shop_name}
                </span>
              </button>
            )}

            {/* Items */}
            <div className="space-y-3 mb-4">
              {cart.items.map((item: any) => (
                <div key={item.id}
                  className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
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
                      {formatRupee(item.unit_price)} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 bg-gray-50 rounded-xl px-1.5 py-1 border border-gray-100">
                      <button
                        onClick={() => updateItem(item.id, item.quantity - 1)}
                        className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <Minus size={11} className="text-gray-600" />
                      </button>
                      <span className="font-bold text-sm w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        className="w-6 h-6 grad rounded-lg flex items-center justify-center shadow-sm">
                        <Plus size={11} className="text-white" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.id)}
                      className="w-7 h-7 bg-red-50 rounded-xl flex items-center justify-center">
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="bg-white rounded-2xl p-3 shadow-sm mb-3 flex gap-2">
              <input value={coupon} onChange={(e) => setCoupon(e.target.value)}
                placeholder="🎟 Coupon code daalen (optional)"
                className="flex-1 text-sm outline-none text-gray-700 bg-transparent" />
              {coupon && (
                <button className="grad text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                  Apply
                </button>
              )}
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={15} className="text-purple-500" />
                <h3 className="font-bold text-sm text-gray-900">
                  Delivery Address *
                </h3>
              </div>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="Ghar ka address — gali, mohalla, landmark, pin code..."
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-purple-400 resize-none" />
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
              <h3 className="font-bold text-sm text-gray-900 mb-3">
                Payment Method
              </h3>
              <div className="flex gap-3">
                {[
                  { k:"COD", e:"💵", l:"Cash on Delivery", s:"Ghar pe dena" },
                  { k:"UPI", e:"📱", l:"UPI Payment",      s:"GPay/PhonePe" },
                ].map((m) => (
                  <button key={m.k} onClick={() => setPayment(m.k as "COD"|"UPI")}
                    className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                      payment === m.k
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-100 hover:border-gray-200"
                    }`}>
                    <span className="text-2xl">{m.e}</span>
                    <span className="text-xs font-bold text-gray-900">{m.l}</span>
                    <span className="text-[10px] text-gray-400">{m.s}</span>
                  </button>
                ))}
              </div>
              {payment === "UPI" && (
                <div className="mt-3 bg-blue-50 rounded-xl px-3 py-2 text-center">
                  <p className="text-xs text-blue-700 font-medium">
                    UPI ID:{" "}
                    <span className="font-mono font-bold">6387403745@fam</span>
                  </p>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-sm text-gray-900 mb-3">
                Order Summary
              </h3>
              {[
                { l:"Subtotal",         v: formatRupee(cart.subtotal || "0")        },
                { l:"Delivery Charge",  v: formatRupee(cart.delivery_charge || "0") },
                ...(coupon ? [{ l:"Coupon Discount", v: "—" }] : []),
              ].map((r) => (
                <div key={r.l} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-500 text-sm">{r.l}</span>
                  <span className="font-semibold text-sm text-gray-900">{r.v}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 mt-1">
                <span className="font-extrabold text-gray-900">Total</span>
                <span className="font-extrabold text-purple-600 text-xl">
                  {formatRupee(total)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sticky Place Order */}
      {!isEmpty && !loading && (
        <div className="fixed bottom-16 left-0 right-0 bg-gradient-to-t from-slate-100 via-slate-50 to-transparent px-4 pt-4 pb-3">
          <div className="max-w-md mx-auto">
            <button onClick={placeOrder} disabled={placing || !address.trim()}
              className="w-full grad text-white font-extrabold py-4 rounded-2xl shadow-xl shadow-purple-300/40 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all">
              {placing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowRight size={20} />
                  Order Place Karein — {formatRupee(total)}
                </>
              )}
            </button>
            {!address.trim() && (
              <p className="text-center text-xs text-gray-400 mt-2">
                ↑ Delivery address daalna zaroori hai
              </p>
            )}
          </div>
        </div>
      )}

      <BotNav />
    </div>
  );
}
