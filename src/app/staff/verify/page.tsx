"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { TopNav } from "@/components/layout/navbar";
import {
  Search, Shield, CheckCircle, XCircle,
  User, Phone, Mail, MapPin, Clock,
  AlertCircle, FileText, Camera,
} from "lucide-react";
import { toast } from "sonner";
import { timeAgo } from "@/lib/utils";

export default function StaffVerifyPage() {
  const router = useRouter();
  const { user, isAuth } = useAuthStore();
  const [vnInput,  setVnInput]  = useState("");
  const [profile,  setProfile]  = useState<any>(null);
  const [loading,  setLoading]  = useState(false);
  const [acting,   setActing]   = useState(false);
  const [note,     setNote]     = useState("");
  const [activeTab,setActiveTab]= useState<"kyc"|"orders"|"wallet">("kyc");

  // Only ADMIN and STAFF can access
  if (isAuth && user?.role !== "ADMIN" && user?.role !== "STAFF") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <span className="text-5xl">🔒</span>
          <h2 className="text-xl font-extrabold text-gray-900 mt-4 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-400 text-sm mb-5">
            Yeh page sirf Admin/Staff ke liye hai
          </p>
          <button onClick={() => router.push("/")}
            className="grad text-white font-bold px-6 py-3 rounded-xl">
            Home Jao
          </button>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    router.push("/login");
    return null;
  }

  const search = async () => {
    if (!vnInput.trim()) { toast.error("Virtual number daalen"); return; }
    setLoading(true);
    setProfile(null);
    try {
      const vn = vnInput.trim().replace(/^@/, "");
      const r = await api.get(`/users/virtual/${vn}/`);
      setProfile(r.data.data);
    } catch (e: any) {
      if (e.response?.status === 404) toast.error("User nahi mila");
      else toast.error("Error: " + e.message);
    } finally { setLoading(false); }
  };

  const verifyAction = async (action: string) => {
    if (!profile) return;
    setActing(true);
    try {
      await api.post(`/users/${profile.id}/staff-action/`, {
        action,
        note: note.trim() || undefined,
      });
      toast.success(`✅ ${action} action complete!`);
      // Reload profile
      const vn = profile.virtual_number?.replace("@", "");
      const r = await api.get(`/users/virtual/${vn}/`);
      setProfile(r.data.data);
      setNote("");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Action failed");
    } finally { setActing(false); }
  };

  const STATUS_COLOR: Record<string, string> = {
    true:  "text-green-600",
    false: "text-gray-400",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 pb-10">

        {/* Header */}
        <div className="grad rounded-3xl p-5 mb-5 text-white shadow-xl shadow-purple-300/30">
          <div className="flex items-center gap-3 mb-1">
            <Shield size={20} className="text-white/80" />
            <h1 className="font-extrabold text-xl">Staff Verification Portal</h1>
          </div>
          <p className="text-white/70 text-sm">
            KYC, verification aur user management
          </p>
          <div className="mt-3 bg-white/10 rounded-xl px-3 py-2 inline-flex items-center gap-2">
            <User size={13} className="text-white/70" />
            <span className="text-white/80 text-xs font-medium">
              {user?.virtual_name || user?.full_name} · {user?.role}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <label className="text-xs font-semibold text-gray-600 block mb-2">
            Virtual Number Se User Dhundho
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 font-bold text-sm">@</span>
              <input
                value={vnInput}
                onChange={(e) => setVnInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                placeholder="ROI00786"
                className="w-full bg-gray-50 rounded-xl pl-8 pr-4 py-3 text-sm font-mono border border-gray-200 outline-none focus:border-purple-400"
              />
            </div>
            <button onClick={search} disabled={loading}
              className="grad text-white font-bold px-4 py-3 rounded-xl shadow-md disabled:opacity-60 flex items-center gap-1.5 flex-shrink-0">
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Search size={15} /> Search</>
              }
            </button>
          </div>
        </div>

        {/* Profile Found */}
        {profile && (
          <div className="space-y-4">

            {/* User Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="grad p-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {profile.virtual_photo
                      ? <img src={profile.virtual_photo} alt="" className="w-full h-full object-cover rounded-2xl" />
                      : <span className="text-2xl font-extrabold text-white">
                          {(profile.virtual_name || profile.full_name || "U")[0].toUpperCase()}
                        </span>
                    }
                  </div>
                  <div>
                    <h2 className="font-extrabold text-white text-lg">
                      {profile.virtual_name || profile.full_name}
                    </h2>
                    <p className="font-mono text-white/80 text-sm">
                      @{profile.virtual_number?.replace("@","")}
                    </p>
                    <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full mt-1 inline-block">
                      {profile.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {/* Details */}
                {[
                  { icon: Mail,   l: "Email",   v: profile.email },
                  { icon: Phone,  l: "Phone",   v: profile.phone || "—" },
                  { icon: MapPin, l: "Location",v: [profile.village, profile.district, profile.state].filter(Boolean).join(", ") || "—" },
                  { icon: Clock,  l: "Joined",  v: profile.date_joined ? timeAgo(profile.date_joined) : "—" },
                ].map((d) => {
                  const Icon = d.icon;
                  return (
                    <div key={d.l} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon size={13} className="text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{d.l}</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{d.v}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              {(["kyc","orders","wallet"] as const).map((t) => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === t ? "bg-white text-purple-600 shadow-sm" : "text-gray-500"
                  }`}>
                  {t === "kyc" ? "🛡 KYC" : t === "orders" ? "📦 Orders" : "💰 Wallet"}
                </button>
              ))}
            </div>

            {/* KYC Tab */}
            {activeTab === "kyc" && (
              <div className="space-y-3">
                {/* Verification Status */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3">Verification Status</h3>
                  <div className="space-y-3">
                    {[
                      { l: "Email Verified",   v: profile.is_verified,        k: "verify_email"   },
                      { l: "Phone Verified",   v: profile.is_phone_verified,   k: "verify_phone"   },
                      { l: "Onboarding Done",  v: profile.onboarding_complete, k: null             },
                      { l: "KYC Complete",     v: profile.kyc_complete,        k: "approve_kyc"    },
                      { l: "Account Active",   v: profile.is_active,           k: "toggle_active"  },
                    ].map((item) => (
                      <div key={item.l}
                        className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          {item.v
                            ? <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
                            : <Clock size={15} className="text-gray-300 flex-shrink-0" />
                          }
                          <span className="text-sm text-gray-700 font-medium">{item.l}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${item.v ? "text-green-600" : "text-gray-400"}`}>
                            {item.v ? "Done" : "Pending"}
                          </span>
                          {item.k && !item.v && (
                            <button
                              onClick={() => verifyAction(item.k!)}
                              disabled={acting}
                              className="text-[10px] font-bold bg-purple-50 text-purple-600 px-2 py-1 rounded-lg hover:bg-purple-100 disabled:opacity-60"
                            >
                              Mark Done
                            </button>
                          )}
                          {item.k === "toggle_active" && (
                            <button
                              onClick={() => verifyAction(item.v ? "deactivate" : "activate")}
                              disabled={acting}
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg disabled:opacity-60 ${
                                item.v
                                  ? "bg-red-50 text-red-500 hover:bg-red-100"
                                  : "bg-green-50 text-green-600 hover:bg-green-100"
                              }`}
                            >
                              {item.v ? "Deactivate" : "Activate"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3">Staff Actions</h3>

                  {/* Note */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-gray-600 block mb-1">
                      Note (optional)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Action ka reason ya note..."
                      rows={2}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-purple-400 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { l: "✅ Approve KYC",     k: "approve_kyc",      c: "bg-green-50 border-green-200 text-green-700" },
                      { l: "❌ Reject KYC",      k: "reject_kyc",       c: "bg-red-50 border-red-200 text-red-600"       },
                      { l: "📧 Send OTP",        k: "send_otp",         c: "bg-blue-50 border-blue-200 text-blue-700"    },
                      { l: "🔄 Reset Password",  k: "reset_password",   c: "bg-amber-50 border-amber-200 text-amber-700" },
                      { l: "🔒 Suspend",         k: "suspend",          c: "bg-red-50 border-red-200 text-red-600"       },
                      { l: "🟢 Activate",        k: "activate",         c: "bg-green-50 border-green-200 text-green-700" },
                      { l: "💰 Credit Wallet",   k: "credit_wallet",    c: "bg-purple-50 border-purple-200 text-purple-700" },
                      { l: "📝 Add Note",        k: "add_note",         c: "bg-gray-50 border-gray-200 text-gray-700"    },
                    ].map((a) => (
                      <button key={a.k}
                        onClick={() => verifyAction(a.k)}
                        disabled={acting}
                        className={`w-full border rounded-xl py-2.5 px-3 text-xs font-bold transition-all disabled:opacity-60 text-left ${a.c}`}
                      >
                        {a.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Document Upload Area */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText size={15} className="text-purple-500" />
                    KYC Documents
                  </h3>
                  <div className="space-y-2">
                    {[
                      { l: "Aadhaar Card",  k: "aadhaar",  v: profile.kyc?.aadhaar_verified  },
                      { l: "PAN Card",      k: "pan",      v: profile.kyc?.pan_verified       },
                      { l: "Selfie",        k: "selfie",   v: profile.kyc?.selfie_verified    },
                      { l: "Address Proof", k: "address",  v: profile.kyc?.address_verified   },
                    ].map((d) => (
                      <div key={d.k}
                        className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Camera size={14} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">{d.l}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {d.v ? (
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              ✓ Verified
                            </span>
                          ) : (
                            <>
                              <span className="text-xs text-gray-400">Pending</span>
                              <button
                                onClick={() => verifyAction(`verify_${d.k}`)}
                                disabled={acting}
                                className="text-[10px] font-bold bg-purple-50 text-purple-600 px-2 py-1 rounded-lg">
                                Verify
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warning Box */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-700">Staff Guidelines</p>
                      <p className="text-xs text-amber-600 mt-1 leading-relaxed">
                        Sabhi actions logged hain. Sahi documents dekhe bagair KYC approve mat karein.
                        Suspicious activity report karein.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3">User Orders</h3>
                {(profile.recent_orders || []).length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-3xl">📦</span>
                    <p className="text-gray-400 text-sm mt-2">Koi orders nahi</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {profile.recent_orders.map((o: any) => (
                      <div key={o.id} className="bg-gray-50 rounded-xl p-3">
                        <div className="flex justify-between">
                          <span className="font-mono font-bold text-xs">#{o.order_number}</span>
                          <span className="text-xs font-bold text-purple-600">₹{o.total_amount}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{o.status} · {timeAgo(o.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Wallet Tab */}
            {activeTab === "wallet" && (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3">Wallet Info</h3>
                  <div className="grad rounded-2xl p-4 text-white mb-3">
                    <p className="text-white/70 text-xs">Balance</p>
                    <p className="text-3xl font-extrabold">
                      ₹{profile.wallet_balance || "0"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const amt = window.prompt("Credit amount (₹):");
                        if (amt) verifyAction(`credit_wallet_${amt}`);
                      }}
                      className="bg-green-50 border border-green-200 text-green-700 font-bold py-2.5 rounded-xl text-xs">
                      + Credit Wallet
                    </button>
                    <button
                      onClick={() => {
                        const amt = window.prompt("Debit amount (₹):");
                        if (amt) verifyAction(`debit_wallet_${amt}`);
                      }}
                      className="bg-red-50 border border-red-200 text-red-600 font-bold py-2.5 rounded-xl text-xs">
                      - Debit Wallet
                    </button>
                  </div>
                </div>
                {/* Pending Topup Requests */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3">Pending Topup</h3>
                  {(profile.pending_topups || []).length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">
                      Koi pending topup nahi
                    </p>
                  ) : (
                    profile.pending_topups.map((t: any) => (
                      <div key={t.id} className="bg-gray-50 rounded-xl p-3 mb-2">
                        <div className="flex justify-between mb-1">
                          <span className="font-bold text-sm">₹{t.amount}</span>
                          <span className="text-xs text-amber-600 font-bold">PENDING</span>
                        </div>
                        <p className="text-xs text-gray-400 font-mono">UTR: {t.utr_number}</p>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => verifyAction(`approve_topup_${t.id}`)}
                            className="flex-1 bg-green-50 border border-green-200 text-green-700 text-xs font-bold py-1.5 rounded-lg">
                            Approve
                          </button>
                          <button onClick={() => verifyAction(`reject_topup_${t.id}`)}
                            className="flex-1 bg-red-50 border border-red-200 text-red-600 text-xs font-bold py-1.5 rounded-lg">
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
