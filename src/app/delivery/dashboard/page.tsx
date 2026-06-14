// src/app/delivery/dashboard/page.tsx
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRequireAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import {
  Package, MapPin, CheckCircle,
  Navigation, Clock, RefreshCw, X,
} from "lucide-react";
import { formatRupee, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

export default function DeliveryDashboard() {
  const { user, isLoading } = useRequireAuth("DELIVERY_BOY");
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [wallet,     setWallet]     = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [otpModal,   setOtpModal]   = useState<string | null>(null);
  const [otp,        setOtp]        = useState(["","","","","",""]);
  const [verifying,  setVerifying]  = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  const loadAll = useCallback(async () => {
    if (!user) return;
    try {
      const dr = await api.get("/orders/delivery/mine/");
      const d = dr.data.data?.results || dr.data.data || [];
      setDeliveries(Array.isArray(d) ? d : []);

      api.get("/wallet/")
        .then((r) => setWallet(r.data.data))
        .catch(() => {});
    } catch (e: any) {
      if (e.response?.status !== 404) {
        toast.error("Load error");
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoading && user) {
      loadAll();
      intervalRef.current = setInterval(() => {
        if (document.visibilityState === "visible") loadAll();
      }, 30000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isLoading, user, loadAll]);

  const accept = async (orderNum: string) => {
    try {
      await api.post(`/orders/${orderNum}/delivery/accept/`);
      toast.success("✅ Delivery accept!");
      loadAll();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Accept nahi hua");
    }
  };

  const setDigit = (v: string, i: number) => {
    const a = [...otp];
    a[i] = v.replace(/\D/, "").slice(-1);
    setOtp(a);
    if (a[i] && i < 5) document.getElementById(`dotp${i+1}`)?.focus();
  };

  const verifyOTP = async () => {
    const code = otp.join("");
    if (code.length !== 6) { toast.error("6-digit OTP daalen"); return; }
    if (!otpModal) return;
    setVerifying(true);
    try {
      await api.post(`/orders/${otpModal}/delivery/verify-otp/`, { otp: code });
      toast.success("✅ Delivery complete! Earnings credit!");
      setOtpModal(null);
      setOtp(["","","","","",""]);
      loadAll();
    } catch {
      toast.error("OTP galat hai");
      setOtp(["","","","","",""]);
      document.getElementById("dotp0")?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const pending   = deliveries.filter((d) => ["READY","CONFIRMED","PENDING"].includes(d.status));
  const active    = deliveries.filter((d) => d.status === "OUT_FOR_DELIVERY");
  const completed = deliveries.filter((d) => d.status === "DELIVERED");

  if (isLoading || (loading && !deliveries.length)) return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        <div className="h-44 bg-gray-200 rounded-3xl animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
        ))}
      </div>
      <BotNav />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 pb-24">

        {/* Hero Card */}
        <div className="grad rounded-3xl p-5 mb-5 text-white shadow-xl shadow-purple-300/30">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wide">
                Delivery Boy
              </p>
              <h1 className="font-extrabold text-xl mt-0.5">
                {user?.virtual_name || user?.full_name}
              </h1>
              {user?.virtual_number && (
                <p className="font-mono text-white/70 text-xs mt-0.5">
                  {user.virtual_number}
                </p>
              )}
            </div>
            <button
              onClick={loadAll}
              className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center"
            >
              <RefreshCw size={16} className="text-white" />
            </button>
          </div>
          <div className="flex gap-2">
            {[
              { l: "Available", v: pending.length   },
              { l: "Active",    v: active.length    },
              { l: "Done",      v: completed.length },
              { l: "Balance",   v: `₹${wallet?.balance || 0}` },
            ].map((s) => (
              <div key={s.l} className="flex-1 bg-white/20 rounded-xl p-2 text-center">
                <p className="font-extrabold text-sm leading-none">{s.v}</p>
                <p className="text-white/60 text-[9px] mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
          <p className="text-white/40 text-[10px] mt-3 text-center">
            Auto-refresh: 30 sec
          </p>
        </div>

        {/* Active Deliveries */}
        {active.length > 0 && (
          <div className="mb-4">
            <h2 className="font-extrabold text-gray-900 mb-3">
              🚴 Active ({active.length})
            </h2>
            {active.map((d: any) => (
              <div
                key={d.id}
                className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-orange-400 mb-3"
              >
                <div className="flex justify-between mb-2">
                  <span className="font-mono font-bold text-sm">
                    #{d.order_number}
                  </span>
                  <span className="font-extrabold text-green-600">
                    +{formatRupee(d.delivery_charge || 30)}
                  </span>
                </div>
                <div className="flex items-start gap-1.5 mb-1">
                  <MapPin size={13} className="text-purple-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600">{d.delivery_address}</p>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  {d.total_items} items · {timeAgo(d.created_at)}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(d.delivery_address || "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold rounded-xl"
                  >
                    <Navigation size={13} /> Map
                  </a>
                  <button
                    onClick={() => {
                      setOtpModal(d.order_number);
                      setOtp(["","","","","",""]);
                      setTimeout(() => document.getElementById("dotp0")?.focus(), 200);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 grad text-white text-xs font-bold rounded-xl"
                  >
                    <CheckCircle size={13} /> OTP Verify
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Available */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-gray-900">
            📦 Available ({pending.length})
          </h2>
        </div>

        {pending.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm mb-4">
            <Package size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Koi delivery available nahi</p>
            <button onClick={loadAll} className="mt-2 text-purple-600 font-bold text-xs">
              Refresh karein
            </button>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {pending.map((d: any) => (
              <div key={d.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between mb-1.5">
                  <span className="font-mono font-bold text-sm">#{d.order_number}</span>
                  <span className="font-extrabold text-green-600 text-sm">
                    +{formatRupee(d.delivery_charge || 30)}
                  </span>
                </div>
                <div className="flex items-start gap-1.5 mb-1">
                  <MapPin size={13} className="text-purple-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600">{d.delivery_address}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                  <span>🏪 {d.shop_name}</span>
                  <span><Clock size={10} className="inline" /> {timeAgo(d.created_at)}</span>
                </div>
                <button
                  onClick={() => accept(d.order_number)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 grad text-white text-xs font-extrabold rounded-xl shadow-md"
                >
                  <Navigation size={14} /> Accept Delivery
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <div>
            <h2 className="font-extrabold text-gray-900 mb-2">
              ✅ Completed ({completed.length})
            </h2>
            <div className="space-y-2">
              {completed.slice(0, 5).map((d: any) => (
                <div
                  key={d.id}
                  className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-bold text-xs">#{d.order_number}</span>
                    <p className="text-xs text-gray-400">{timeAgo(d.created_at)}</p>
                  </div>
                  <span className="font-extrabold text-green-600 text-sm">
                    +{formatRupee(d.delivery_charge || 30)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* OTP Modal */}
      {otpModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-xl text-gray-900">
                  Delivery OTP
                </h3>
                <p className="text-gray-400 text-sm">
                  Order <span className="font-mono font-bold text-purple-600">
                    #{otpModal}
                  </span> — Customer se OTP lo
                </p>
              </div>
              <button
                onClick={() => { setOtpModal(null); setOtp(["","","","","",""]); }}
                className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="flex gap-2 mb-5">
              {otp.map((d, i) => (
                <input
                  key={i}
                  id={`dotp${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => setDigit(e.target.value, i)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !d && i > 0) {
                      document.getElementById(`dotp${i-1}`)?.focus();
                    }
                  }}
                  className="flex-1 h-14 text-center text-2xl font-extrabold border-2 border-gray-200 rounded-2xl outline-none focus:border-purple-500 transition-all"
                />
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setOtpModal(null); setOtp(["","","","","",""]); }}
                className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={verifyOTP}
                disabled={verifying || otp.join("").length < 6}
                className="flex-1 py-3.5 grad text-white font-extrabold rounded-xl shadow-lg shadow-purple-200 disabled:opacity-60"
              >
                {verifying ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : "Verify & Complete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BotNav />
    </div>
  );
}
