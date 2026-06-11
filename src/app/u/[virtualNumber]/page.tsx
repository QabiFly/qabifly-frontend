"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { TopNav } from "@/components/layout/navbar";
import {
  MapPin, Store, Package, Shield,
  CheckCircle, Clock, ArrowLeft, Send
} from "lucide-react";

export default function VirtualProfilePage() {
  const { virtualNumber } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!virtualNumber) return;
    // Format: @ROI00786 → ROI00786
    const vn = (virtualNumber as string).replace("@", "");
    api.get(`/users/virtual/${vn}/`)
      .then((r) => setProfile(r.data.data))
      .catch((e) => {
        if (e.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [virtualNumber]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-16 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-3xl mx-auto mb-4 flex items-center justify-center">
          <span className="text-4xl">🔍</span>
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">
          Virtual Number Nahi Mila
        </h2>
        <p className="text-gray-400 text-sm mb-5">
          <span className="font-mono font-bold text-purple-600">
            @{virtualNumber}
          </span>{" "}
          koi registered user nahi hai
        </p>
        <button onClick={() => router.back()}
          className="grad text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-purple-200">
          ← Wapas
        </button>
      </div>
    </div>
  );

  const role = profile?.role;

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4">

        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-gray-400 text-sm mb-4 hover:text-gray-600">
          <ArrowLeft size={14} /> Wapas
        </button>

        {/* Profile Card */}
        <div className="grad rounded-3xl p-5 mb-4 text-white shadow-xl shadow-purple-300/30">
          <div className="flex items-center gap-4">
            <div className="w-18 h-18 rounded-2xl bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0 w-16 h-16">
              {profile?.virtual_photo ? (
                <img src={profile.virtual_photo} alt=""
                  className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <span className="text-3xl font-extrabold">
                  {(profile?.virtual_name || profile?.full_name || "U")[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="font-extrabold text-xl leading-tight">
                {profile?.virtual_name || profile?.full_name}
              </h1>
              <p className="font-mono text-white/80 text-sm mt-0.5">
                @{profile?.virtual_number?.replace("@", "")}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {role === "BUYER" ? "🛒 Buyer"
                   : role === "SHOPKEEPER" ? "🏪 Shopkeeper"
                   : role === "DELIVERY_BOY" ? "🚴 Delivery Boy"
                   : "👤 User"}
                </span>
                {profile?.is_verified && (
                  <span className="bg-green-500/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle size={10} /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          {(profile?.village || profile?.district) && (
            <div className="flex items-center gap-1.5 mt-4 bg-white/10 rounded-xl px-3 py-2">
              <MapPin size={13} className="text-white/70" />
              <span className="text-white/80 text-xs font-medium">
                {[profile.village, profile.district, profile.state]
                  .filter(Boolean).join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* KYC Status */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Shield size={16} className="text-purple-500" />
            KYC Status
          </h3>
          <div className="space-y-2.5">
            {[
              { l: "Email",          v: profile?.is_verified,       e: "✉️" },
              { l: "Phone",          v: profile?.is_phone_verified,  e: "📱" },
              { l: "Onboarding",     v: profile?.onboarding_complete,e: "✅" },
            ].map((item) => (
              <div key={item.l} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{item.e}</span>
                  <span className="text-sm text-gray-600 font-medium">{item.l}</span>
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold ${
                  item.v ? "text-green-600" : "text-gray-400"
                }`}>
                  {item.v
                    ? <><CheckCircle size={13} /> Verified</>
                    : <><Clock size={13} /> Pending</>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shop Info (if shopkeeper) */}
        {role === "SHOPKEEPER" && profile?.shop && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Store size={16} className="text-purple-500" />
              Shop
            </h3>
            <button onClick={() => router.push(`/shops/${profile.shop.slug}`)}
              className="w-full flex items-center gap-3 bg-purple-50 rounded-xl p-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                {profile.shop.logo
                  ? <img src={profile.shop.logo} alt="" className="w-full h-full object-cover rounded-xl" />
                  : <Store size={18} className="text-purple-400" />
                }
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900">{profile.shop.name}</p>
                <p className="text-xs text-purple-600">Shop dekho →</p>
              </div>
            </button>
          </div>
        )}

        {/* Message Button */}
        <button
          onClick={() => alert("Message feature coming soon!")}
          className="w-full grad text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-purple-200 flex items-center justify-center gap-2">
          <Send size={16} />
          Message Karein
        </button>

      </div>
    </div>
  );
}
