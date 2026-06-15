// src/app/delivery/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useGuard } from "@/lib/auth-guard";
import { api } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import {
  Package, MapPin, CheckCircle,
  Navigation, Clock, RefreshCw, X, Wallet,
} from "lucide-react";
import { formatRupee, timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Types
interface DeliveryOrder {
  id: number;
  order_number: string;
  status: string;
  delivery_address: string;
  shop_name?: string;
  total_items: number;
  created_at: string;
  delivery_charge?: number;
}

interface WalletData {
  balance: number;
}

export default function DeliveryDashboard() {
  const router = useRouter();
  const { user, ready, isLoading: authLoading } = useGuard("DELIVERY_BOY");
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const [otpModal, setOtpModal] = useState<string | null>(null);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const loadWallet = useCallback(async () => {
    try {
      const response = await api.get("/wallet/");
      setWallet(response.data?.data || response.data);
    } catch {
      // Wallet may not exist yet - ignore
    }
  }, []);

  const loadDeliveries = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    try {
      const response = await api.get("/orders/delivery/mine/");
      const data = response.data?.data?.results || response.data?.data || [];
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error("Delivery load error:", error.response?.status);
        toast.error("Failed to load deliveries");
      }
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  }, [ready]);

  const loadAll = useCallback(async () => {
    if (!ready) return;
    await Promise.all([loadDeliveries(), loadWallet()]);
  }, [ready, loadDeliveries, loadWallet]);

  // Initial load and guard
  useEffect(() => {
    if (!ready || authLoading) return;
    loadAll();

    timerRef.current = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadAll();
      }
    }, 20000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [ready, authLoading, loadAll]);

  const acceptDelivery = async (orderNumber: string) => {
    try {
      await api.post(`/orders/${orderNumber}/delivery/accept/`);
      toast.success("✅ Delivery accepted! Proceed to pickup.");
      loadAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Accept failed");
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-focus next input
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when 6 digits filled
    if (newOtp.every(d => d !== "") && newOtp.length === 6) {
      verifyOTP(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOTP = async (code: string) => {
    if (!otpModal || code.length !== 6) return;
    setVerifying(true);
    try {
      await api.post(`/orders/${otpModal}/delivery/verify-otp/`, { otp: code });
      toast.success("✅ Delivered! Payment credited.");
      setOtpModal(null);
      setOtp(["", "", "", "", "", ""]);
      loadAll();
    } catch {
      toast.error("Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const closeOtpModal = () => {
    setOtpModal(null);
    setOtp(["", "", "", "", "", ""]);
  };

  const pending = deliveries.filter(d => ["READY", "CONFIRMED"].includes(d.status));
  const active = deliveries.filter(d => d.status === "OUT_FOR_DELIVERY");
  const completed = deliveries.filter(d => d.status === "DELIVERED");

  // Loading state while guard initializes or first load
  if (authLoading || (loading && deliveries.length === 0 && !ready)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TopNav />
        <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
          <div className="h-44 bg-gray-200 rounded-3xl animate-pulse" />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
        <BotNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 pb-24">
        {/* Hero Section */}
        <div className="grad rounded-3xl p-5 mb-5 text-white shadow-xl shadow-purple-300/30">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wide">Delivery Partner</p>
              <h1 className="font-extrabold text-xl mt-0.5">
                {user?.virtual_name || user?.full_name || "Delivery Boy"}
              </h1>
              {user?.virtual_number && (
                <p className="font-mono text-white/70 text-xs mt-0.5">{user.virtual_number}</p>
              )}
            </div>
            <button
              onClick={loadAll}
              disabled={loading}
              className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center disabled:opacity-50"
              aria-label="Refresh"
            >
              <RefreshCw size={16} className={`text-white ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="flex gap-2">
            {[
              { label: "Available", value: pending.length },
              { label: "Active", value: active.length },
              { label: "Completed", value: completed.length },
              { label: "Balance", value: `₹${wallet?.balance ?? 0}` },
            ].map(stat => (
              <div key={stat.label} className="flex-1 bg-white/20 rounded-xl p-2 text-center">
                <p className="font-extrabold text-base leading-none">{stat.value}</p>
                <p className="text-white/60 text-[9px] mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="text-white/40 text-[10px] mt-3 text-center">
            Auto-refresh: 20 sec · Auto-assign: 5 min
          </p>
        </div>

        {/* Wallet Quick Link */}
        <button
          onClick={() => router.push("/wallet")}
          className="w-full bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3 mb-4"
        >
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <Wallet size={18} className="text-green-600" />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm text-gray-900">My Earnings</p>
            <p className="text-xs text-gray-400">Balance: ₹{wallet?.balance ?? 0}</p>
          </div>
        </button>

        {/* Active Deliveries */}
        {active.length > 0 && (
          <div className="mb-4">
            <h2 className="font-extrabold text-gray-900 mb-3">🚴 Active ({active.length})</h2>
            {active.map(order => (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-orange-400 mb-3"
              >
                <div className="flex justify-between mb-2">
                  <span className="font-mono font-bold text-sm">#{order.order_number}</span>
                  <span className="font-extrabold text-green-600">
                    +{formatRupee(order.delivery_charge ?? 30)}
                  </span>
                </div>
                <div className="flex items-start gap-1.5 mb-1">
                  <MapPin size={13} className="text-purple-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600">{order.delivery_address}</p>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  {order.total_items} items · {timeAgo(order.created_at)}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(order.delivery_address || "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold rounded-xl"
                  >
                    <Navigation size={13} /> Open Map
                  </a>
                  <button
                    onClick={() => {
                      setOtpModal(order.order_number);
                      setOtp(["", "", "", "", "", ""]);
                      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 grad text-white text-xs font-bold rounded-xl shadow-md"
                  >
                    <CheckCircle size={13} /> Verify OTP
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Available Deliveries */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-gray-900">📦 Available ({pending.length})</h2>
        </div>

        {pending.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm mb-4">
            <Package size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No deliveries available</p>
            <p className="text-xs text-gray-300 mt-1">Auto-refreshing...</p>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {pending.map(order => (
              <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between mb-1.5">
                  <span className="font-mono font-bold text-sm">#{order.order_number}</span>
                  <span className="font-extrabold text-green-600">
                    +{formatRupee(order.delivery_charge ?? 30)}
                  </span>
                </div>
                <div className="flex items-start gap-1.5 mb-1">
                  <MapPin size={13} className="text-purple-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600">{order.delivery_address}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                  <span>🏪 {order.shop_name || "Shop"}</span>
                  <span><Clock size={10} className="inline mr-0.5" />{timeAgo(order.created_at)}</span>
                </div>
                <button
                  onClick={() => acceptDelivery(order.order_number)}
                  className="w-full flex items-center justify-center gap-2 py-3 grad text-white text-sm font-extrabold rounded-xl shadow-md shadow-purple-200"
                >
                  <Navigation size={16} /> Accept Delivery
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Completed Deliveries */}
        {completed.length > 0 && (
          <div>
            <h2 className="font-extrabold text-gray-900 mb-2">✅ Completed</h2>
            <div className="space-y-2">
              {completed.slice(0, 5).map(order => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-bold text-xs">#{order.order_number}</span>
                    <p className="text-xs text-gray-400">{timeAgo(order.created_at)}</p>
                  </div>
                  <span className="font-extrabold text-green-600">
                    +{formatRupee(order.delivery_charge ?? 30)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* OTP Modal */}
      {otpModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-xl text-gray-900">Customer OTP</h3>
                <p className="text-gray-400 text-sm">
                  Order <span className="font-mono font-bold text-purple-600">#{otpModal}</span>
                </p>
              </div>
              <button
                onClick={closeOtpModal}
                className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center"
                aria-label="Close"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="text-sm text-gray-600 mb-4 bg-blue-50 rounded-xl p-3">
              📱 Ask the customer for the 6‑digit OTP sent to their phone.
            </div>
            <div className="flex gap-2 mb-5 justify-center">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { otpInputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(e.target.value, idx)}
                  onKeyDown={e => handleOtpKeyDown(e, idx)}
                  className="w-12 h-14 text-center text-2xl font-extrabold border-2 border-gray-200 rounded-2xl outline-none focus:border-purple-500 transition-all"
                  aria-label={`OTP digit ${idx + 1}`}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={closeOtpModal}
                className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => verifyOTP(otp.join(""))}
                disabled={verifying || otp.some(d => !d)}
                className="flex-1 py-3.5 grad text-white font-extrabold rounded-xl shadow-lg disabled:opacity-60"
              >
                {verifying ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  "✅ Verify & Complete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <BotNav />
    </div>
  );
}
