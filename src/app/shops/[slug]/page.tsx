"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import {
  MapPin, Star, ChevronRight,
  Search, RefreshCw, Loader2,
} from "lucide-react";

export default function ShopsPage() {
  const router = useRouter();
  const [shops,   setShops]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [mode,    setMode]    = useState("all"); // all | nearby

  const loadAll = async () => {
    setLoading(true);
    try {
      // /shops/ seedha — koi filter nahi
      const r = await api.get("/shops/");
      const d = r.data.data?.results
             || r.data.data
             || r.data?.results
             || r.data
             || [];
      setShops(Array.isArray(d) ? d : []);
    } catch (e: any) {
      console.error("Shops error:", e.response?.status);
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  const loadNearby = async () => {
    setLoading(true);
    try {
      // GPS lo
      const getPos = () => new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      );

      let lat = 25.7425, lon = 84.2;
      try {
        const pos = await getPos();
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      } catch {}

      const r = await api.get("/shops/nearby/", {
        params: { lat, lon, radius: 9999 } // Pure India
      });
      const d = r.data.data || r.data?.results || [];
      setShops(Array.isArray(d) ? d : []);
    } catch {
      await loadAll(); // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "nearby") loadNearby();
    else loadAll();
  }, [mode]);

  const filtered = !search ? shops : shops.filter((s: any) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.village?.toLowerCase().includes(search.toLowerCase()) ||
    s.district?.toLowerCase().includes(search.toLowerCase()) ||
    s.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pb-24 pt-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">Shops 🏪</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {shops.length} shops available
            </p>
          </div>
          <button
            onClick={() => mode === "all" ? loadAll() : loadNearby()}
            className="flex items-center gap-1 text-xs text-purple-600 font-bold bg-purple-50 px-3 py-1.5 rounded-full"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-4">
          <button
            onClick={() => setMode("all")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              mode === "all"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-gray-500"
            }`}
          >
            🌏 All India
          </button>
          <button
            onClick={() => setMode("nearby")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              mode === "nearby"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-gray-500"
            }`}
          >
            📍 Mere Paas
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={15}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Shop, city, category search karein..."
            className="w-full bg-white rounded-xl pl-9 pr-4 py-2.5 text-sm border border-gray-200 outline-none focus:border-purple-400 shadow-sm"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={32} className="animate-spin text-purple-400" />
            <p className="text-gray-400 text-sm">Shops load ho rahi hain...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm px-4">
            <span className="text-5xl">🏪</span>
            <p className="text-gray-500 font-bold mt-4">
              {shops.length === 0 ? "Koi shop nahi hai" : "Search result nahi mila"}
            </p>
            {shops.length === 0 && (
              <p className="text-gray-400 text-xs mt-2 max-w-[200px] mx-auto">
                Admin se shop approve karwayein ya coordinates fix karein
              </p>
            )}
            <button
              onClick={() => mode === "all" ? loadAll() : loadNearby()}
              className="mt-4 grad text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-lg shadow-purple-200"
            >
              Dobara Try Karein
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s: any) => (
              <button
                key={s.id}
                onClick={() => router.push(`/shops/${s.slug}`)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-3 active:scale-[0.99]"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-purple-50 flex items-center justify-center">
                  {s.logo
                    ? <img src={s.logo} alt={s.name} className="w-full h-full object-cover" />
                    : <span className="text-2xl">🏪</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-gray-900 text-sm truncate">
                      {s.name}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      s.is_open
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-400"
                    }`}>
                      {s.is_open ? "Open" : "Closed"}
                    </span>
                  </div>
                  {s.category && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {s.category.name}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {s.average_rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star size={11} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-semibold">
                          {s.average_rating}
                        </span>
                      </div>
                    )}
                    {(s.village || s.district) && (
                      <div className="flex items-center gap-1">
                        <MapPin size={11} className="text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {[s.village, s.district].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                    {s.distance_km !== undefined && (
                      <span className="text-xs text-gray-400">
                        {s.distance_km} km
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
      <BotNav />
    </div>
  );
}
