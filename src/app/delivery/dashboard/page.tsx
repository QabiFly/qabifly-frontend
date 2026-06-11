"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import {
  Package, MapPin, CheckCircle,
  Navigation, Clock, Wallet, RefreshCw,
} from "lucide-react";
import { formatRupee, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

export default function DeliveryDashboard() {
  const router = useRouter();
  const { user, isAuth } = useAuthStore();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [wallet,     setWallet]     = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [otpModal,   setOtpModal]   = useState<string|null>(null);
  const [otp,        setOtp]        = useState("");
  const [verifying,  setVerifying]  = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (!isAuth) { router.push("/login"); return; }
    if (user?.role !== "DELIVERY_BOY") { router.push("/"); return; }
    if (fetched.current) return;
    fetched.current = true;
    loadAll();
  }, [isAuth, user]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [dr, wr] = await Promise.all([
        api.get("/orders/delivery/mine/"),
        api.get("/wallet/").catch(() => ({ data: { data: null } })),
      ]);
      const d = dr.data.data?.results || dr.data.data || [];
      setDeliveries(Array.isArray(d) ? d : []);
      setWallet(wr.data.data);
    } catch { toast.error("Data load nahi hua"); }
    finally { setLoading(false); }
  };

  const accept = async (orderNum: string) => {
    try {
      await api.post(`/orders/${orderNum}/delivery/accept/`);
      toast.success("✅ Delivery accept kar li!");
      loadAll();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Accept nahi hua");
    }
  };

  const verifyOTP = async () => {
    if (!otpModal || !otp) return;
    setVerifying(true);
    try {
      await api.post(`/orders/${otpModal}/delivery/verify-otp/`, { otp });
      toast.success("✅ Delivery complete! Earnings credited.");
      setOtpModal(null); setOtp("");
      loadAll();
    } catch { toast.error("OTP galat hai"); }
    finally { setVerifying(false); }
  };

  const pending   = deliveries.filter(d => d.status === "READY" || d.status === "PENDING");
  const active    = deliveries.filter(d => d.status === "OUT_FOR_DELIVERY");
  const completed = deliveries.filter(d => d.status === "DELIVERED");

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 pb-24">

        {/* Header Card */}
        <div className="grad rounded-3xl p-5 mb-5 text-white shadow-xl shadow-purple-300/30">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white/70 text-xs">Delivery Boy</p>
              <h1 className="font-extrabold text-xl mt-0.5">
                {user?.virtual_name || user?.full_name}
              </h1>
              {user?.virtual_number && (
                <p className="font-mono text-white/70 text-xs mt-0.5">
                  {user.virtual_number}
                </p>
              )}
            </div>
            <button onClick={() => { fetched.current = false; loadAll(); }}
              className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <RefreshCw size={16} className="text-white" />
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-2">
            {[
              { l:"Available",  v: pending.length,   e:"📦" },
              { l:"Active",     v: active.length,    e:"🚴" },
              { l:"Delivered",  v: completed.length, e:"✅" },
              { l:"Earnings",   v: `₹${wallet?.balance || 0}`, e:"💰" },
            ].map(s => (
              <div key={s.l} className="flex-1 bg-white/15 rounded-xl p-2 text-center">
                <p className="text-lg font-extrabold leading-none">{s.v}</p>
                <p className="text-white/70 text-[9px] mt-0.5 font-medium">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Active Deliveries */}
        {active.length > 0 && (
          <div className="mb-4">
            <h2 className="font-extrabold text-gray-900 mb-3">
              🚴 Active Deliveries ({active.length})
            </h2>
            <div className="space-y-3">
              {active.map((d:any) => (
                <div key={d.id} className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-orange-400">
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
                  <p className="text-xs text-gray-400 mb-3">
                    {d.total_items} items · {timeAgo(d.created_at)}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(d.delivery_address)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold rounded-xl">
                      <Navigation size={13} /> Map Dekho
                    </a>
                    <button onClick={() => setOtpModal(d.order_number)}
                      className="flex items-center justify-center gap-1.5 py-2.5 grad text-white text-xs font-bold rounded-xl">
                      <CheckCircle size={13} /> OTP Verify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Orders */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-gray-900">
              📦 Available ({pending.length})
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />)}
            </div>
          ) : pending.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
              <Package size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Abhi koi delivery available nahi</p>
              <button onClick={() => { fetched.current = false; loadAll(); }}
                className="mt-3 text-purple-600 font-bold text-sm">
                Refresh Karein
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((d:any) => (
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
                  <div className="flex items-center gap-3 mb-3 text-xs text-gray-400">
                    <span>🏪 {d.shop_name}</span>
                    <span>📦 {d.total_items} items</span>
                    <span><Clock size={10} className="inline" /> {timeAgo(d.created_at)}</span>
                  </div>
                  <button onClick={() => accept(d.order_number)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 grad text-white text-xs font-extrabold rounded-xl shadow-md shadow-purple-200">
                    <Navigation size={14} /> Accept Delivery
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Completed */}
        {completed.length > 0 && (
          <div>
            <h2 className="font-extrabold text-gray-900 mb-3">
              ✅ Recent Completed
            </h2>
            <div className="space-y-2">
              {completed.slice(0,5).map((d:any) => (
                <div key={d.id}
                  className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-center justify-between">
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6">
            <h3 className="font-extrabold text-xl text-gray-900 mb-1">Delivery OTP Verify</h3>
            <p className="text-gray-400 text-sm mb-4">
              Order <span className="font-mono font-bold">#{otpModal}</span> — Customer se OTP lo
            </p>
            <div className="flex gap-2 mb-4">
              {[0,1,2,3,4,5].map(i => (
                <input key={i} id={`otp${i}`} type="text" inputMode="numeric"
                  maxLength={1}
                  value={otp[i] || ""}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/,"").slice(-1);
                    const a = otp.split("");
                    a[i] = v; const s = a.join("");
                    setOtp(s);
                    if (v && i < 5) document.getElementById(`otp${i+1}`)?.focus();
                  }}
                  className="flex-1 h-12 text-center text-xl font-extrabold border-2 border-gray-200 rounded-xl outline-none focus:border-purple-500" />
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setOtpModal(null); setOtp(""); }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl">
                Cancel
              </button>
              <button onClick={verifyOTP} disabled={verifying || otp.length < 6}
                className="flex-1 py-3 grad text-white font-extrabold rounded-xl shadow-lg shadow-purple-200 disabled:opacity-60">
                {verifying
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  : "Verify & Complete"
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
