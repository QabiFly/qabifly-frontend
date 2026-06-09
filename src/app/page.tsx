"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { shopApi, weatherApi, videoApi, cartApi } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import {
  Store, ShoppingCart, Package, Wallet,
  BookOpen, Video, ArrowRight, MapPin,
  ChefHat, Bike, Star, Play,
  Droplets, Wind, ChevronRight,
} from "lucide-react";
import { formatRupee } from "@/lib/utils";

export default function HomePage() {
  const router             = useRouter();
  const { user, isAuth }   = useAuthStore();
  const { setCart }        = useCartStore();
  const role               = user?.role;
  const [shops,   setShops]   = useState<any[]>([]);
  const [weather, setWeather] = useState<any>(null);
  const [videos,  setVideos]  = useState<any[]>([]);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    // Shops — nearby use karo jo kaam karta hai
    const lat = 25.7425, lon = 84.2000;
    shopApi.nearby(lat, lon)
      .then((r) => {
        const d = r.data.data || r.data?.results || r.data || [];
        setShops(Array.isArray(d) ? d.slice(0, 4) : []);
      })
      .catch(() => {
        // Fallback — all shops
        shopApi.all()
          .then((r) => {
            const d =
              r.data.data?.results ||
              r.data.data ||
              r.data?.results ||
              r.data || [];
            setShops(Array.isArray(d) ? d.slice(0, 4) : []);
          })
          .catch(() => {});
      });

    // Weather
    weatherApi.get()
      .then((r) => {
        const d = r.data.data || r.data;
        if (Array.isArray(d) && d.length > 0) setWeather(d[0]);
        else if (d && typeof d === "object" && d.latest) setWeather(d);
      })
      .catch(() => {});

    // Videos
    videoApi.get()
      .then((r) => {
        const d =
          r.data.data?.results ||
          r.data.data ||
          r.data?.results || [];
        setVideos(Array.isArray(d) ? d.slice(0, 5) : []);
      })
      .catch(() => {});

    // Cart count
    if (isAuth) {
      cartApi.get()
        .then((r) => setCart(r.data.data))
        .catch(() => {});
    }
  }, [isAuth]);

  const buyerActions = [
    { icon: Store,        l: "Shops",   s: "Nearby dukanen",  c: "#4B7BF5", b: "#EEF2FF", h: "/shops",   a: false },
    { icon: ShoppingCart, l: "Cart",    s: "Apna cart",       c: "#7C3AED", b: "#F5F3FF", h: "/cart",    a: false },
    { icon: Package,      l: "Orders",  s: "Track karo",      c: "#059669", b: "#ECFDF5", h: "/orders",  a: true  },
    { icon: Wallet,       l: "Wallet",  s: "Balance dekho",   c: "#D97706", b: "#FFFBEB", h: "/wallet",  a: true  },
    { icon: BookOpen,     l: "Khata",   s: "Udhaar track",    c: "#92400E", b: "#FEF3C7", h: "/udhaar",  a: true  },
    { icon: Video,        l: "Videos",  s: "Kisan content",   c: "#BE185D", b: "#FDF2F8", h: "/videos",  a: false },
  ];
  const shopActions = [
    { icon: ChefHat, l: "Dashboard", s: "Shop manage",  c: "#059669", b: "#ECFDF5", h: "/shopkeeper/dashboard", a: true },
    { icon: Package, l: "Orders",   s: "New orders",    c: "#4B7BF5", b: "#EEF2FF", h: "/shopkeeper/orders",    a: true },
    { icon: Wallet,  l: "Earnings", s: "Kamai dekho",   c: "#D97706", b: "#FFFBEB", h: "/wallet",               a: true },
  ];
  const deliveryActions = [
    { icon: Bike,   l: "Deliveries", s: "Accept karo",  c: "#059669", b: "#ECFDF5", h: "/delivery/dashboard", a: true },
    { icon: Wallet, l: "Earnings",   s: "Kamai dekho",  c: "#D97706", b: "#FFFBEB", h: "/wallet",             a: true },
  ];

  const actions =
    role === "SHOPKEEPER"   ? shopActions :
    role === "DELIVERY_BOY" ? deliveryActions :
    buyerActions;

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-5">

        {/* Hero */}
        <div className="grad rounded-3xl p-5 shadow-xl shadow-purple-300/30">
          <p className="text-white/70 text-sm font-medium">Assalamu Alaikum! 👋</p>
          <h1 className="text-white text-2xl font-extrabold italic leading-tight mt-1">
            {isAuth ? (user?.virtual_name || user?.full_name || "User") : "Mehman"}
          </h1>
          {user?.virtual_number && (
            <span className="font-mono text-white/70 text-xs mt-1 inline-block">
              {user.virtual_number}
            </span>
          )}
          <div className="flex items-center gap-1 mt-2">
            <MapPin size={11} className="text-white/60" />
            <span className="text-white/60 text-[11px] font-semibold uppercase tracking-wide">
              Reoti, Ballia — Apna Gaon Apna Bazaar
            </span>
          </div>
          {!isAuth && (
            <button
              onClick={() => router.push("/login")}
              className="mt-4 flex items-center gap-2 bg-white/20 border border-white/30 text-white text-xs font-bold px-4 py-2 rounded-full"
            >
              Login / Register <ArrowRight size={13} />
            </button>
          )}
        </div>

        {/* Weather */}
        {weather?.latest && (
          <div className="rounded-2xl overflow-hidden shadow-md"
            style={{ background: "linear-gradient(135deg,#4338CA,#7C3AED)" }}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-bold text-sm">🌦️ Reoti Mausam</span>
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">LIVE</span>
              </div>
              <div className="flex items-end gap-3 mb-3">
                <span className="text-white text-5xl font-extrabold leading-none">
                  {parseFloat(weather.latest?.temperature || "0").toFixed(0)}°C
                </span>
              </div>
              <div className="flex gap-2">
                {[
                  { icon: Droplets, label: "Humidity", val: `${parseFloat(weather.latest?.humidity || "0").toFixed(0)}%` },
                  { icon: Wind,     label: "Wind",     val: `${parseFloat(weather.latest?.wind_speed || "0").toFixed(0)} km/h` },
                ].map((w) => (
                  <div key={w.label} className="flex-1 bg-white/15 rounded-xl p-2 flex items-center gap-2">
                    <w.icon size={14} className="text-white/70" />
                    <div>
                      <p className="text-white/60 text-[9px] font-bold uppercase">{w.label}</p>
                      <p className="text-white font-bold text-xs">{w.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="font-extrabold text-gray-900 mb-3">Quick Access</h2>
          <div className="grid grid-cols-3 gap-3">
            {actions.map((a) => {
              const Icon = a.icon;
              return (
                <button key={a.h}
                  onClick={() => { if (a.a && !isAuth) router.push("/login"); else router.push(a.h); }}
                  className="bg-white rounded-2xl p-3 shadow-sm hover:shadow-md transition-all active:scale-95 text-left">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                    style={{ backgroundColor: a.b }}>
                    <Icon size={20} style={{ color: a.c }} />
                  </div>
                  <p className="font-bold text-gray-900 text-xs leading-tight">{a.l}</p>
                  <p className="text-gray-400 text-[10px] mt-0.5 leading-tight">{a.s}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Nearby Shops */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-gray-900">🏪 Nearby Shops</h2>
            <button onClick={() => router.push("/shops")}
              className="text-xs text-purple-600 font-bold flex items-center gap-0.5">
              Sab dekho <ChevronRight size={13} />
            </button>
          </div>

          {shops.length === 0 ? (
            <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
              <span className="text-3xl">🏪</span>
              <p className="text-gray-400 text-sm mt-2">Shops load ho rahi hain...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {shops.map((s: any) => (
                <button key={s.id}
                  onClick={() => router.push(`/shops/${s.slug}`)}
                  className="w-full bg-white rounded-2xl p-3 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {s.logo
                      ? <img src={s.logo} alt={s.name} className="w-full h-full object-cover rounded-xl" />
                      : <span className="text-xl">🏪</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{s.name}</h3>
                    {s.category && <p className="text-xs text-gray-400">{s.category.name}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      {s.average_rating > 0 && (
                        <div className="flex items-center gap-0.5">
                          <Star size={10} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-xs font-semibold text-gray-600">{s.average_rating}</span>
                        </div>
                      )}
                      <span className={`text-xs font-bold ${s.is_open ? "text-green-600" : "text-red-400"}`}>
                        {s.is_open ? "● Open" : "● Closed"}
                      </span>
                      {s.distance_km && (
                        <span className="text-xs text-gray-400">{s.distance_km} km</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Videos */}
        {videos.length > 0 && (
          <div>
            <h2 className="font-extrabold text-gray-900 mb-3">🎬 Kisan Videos</h2>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {videos.map((v: any) => (
                <a key={v.id}
                  href={`https://youtube.com/watch?v=${v.youtube_id}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-shrink-0 w-44 bg-white rounded-2xl overflow-hidden shadow-sm">
                  <div className="relative h-24 bg-gray-100">
                    {v.thumbnail_url
                      ? <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full grad flex items-center justify-center">
                          <Play size={24} className="text-white" />
                        </div>
                    }
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-9 h-9 bg-black/50 rounded-full flex items-center justify-center">
                        <Play size={16} className="text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="font-bold text-gray-900 text-xs leading-tight line-clamp-2">{v.title}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
      <BotNav />
    </div>
  );
}