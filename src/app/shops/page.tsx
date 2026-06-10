"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import { MapPin, Star, ChevronRight, Search, RefreshCw } from "lucide-react";

export default function ShopsPage() {
  const router = useRouter();
  const [shops,   setShops]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const fetched = useRef(false);

  const load = async (lat = 25.7425, lon = 84.2) => {
    setLoading(true);
    try {
      const r = await api.get("/shops/nearby/", {
        params: { lat, lon, radius: 50 }
      });
      const d = r.data.data || r.data?.results || [];
      setShops(Array.isArray(d) ? d : []);
    } catch {
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    navigator.geolocation?.getCurrentPosition(
      (p) => load(p.coords.latitude, p.coords.longitude),
      () => load(),
      { timeout: 4000 }
    ) ?? load();
  }, []);

  const filtered = shops.filter((s: any) =>
    !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.village?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pb-24 pt-4">

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-extrabold text-gray-900">Shops 🏪</h1>
          <button onClick={() => { fetched.current = false; load(); }}
            className="flex items-center gap-1 text-xs text-purple-600 font-bold bg-purple-50 px-3 py-1.5 rounded-full">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Shop search karein..."
            className="w-full bg-white rounded-xl pl-9 pr-4 py-2.5 text-sm border border-gray-200 outline-none focus:border-purple-400 shadow-sm" />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <span className="text-5xl">🏪</span>
            <p className="text-gray-500 font-bold mt-4">Koi shop nahi mili</p>
            <button onClick={() => { fetched.current = false; load(); }}
              className="mt-3 text-purple-600 font-bold text-sm underline">
              Dobara try karein
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s: any) => (
              <button key={s.id} onClick={() => router.push(`/shops/${s.slug}`)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-3 active:scale-[0.99]">
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-purple-50 flex items-center justify-center">
                  {s.logo
                    ? <img src={s.logo} alt={s.name} className="w-full h-full object-cover" />
                    : <span className="text-2xl">🏪</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{s.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      s.is_open ? "bg-green-50 text-green-600" : "bg-red-50 text-red-400"
                    }`}>
                      {s.is_open ? "Open" : "Closed"}
                    </span>
                  </div>
                  {s.category && <p className="text-xs text-gray-400 mt-0.5">{s.category.name}</p>}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {s.average_rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star size={11} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-semibold">{s.average_rating}</span>
                      </div>
                    )}
                    {s.village && (
                      <div className="flex items-center gap-1">
                        <MapPin size={11} className="text-gray-400" />
                        <span className="text-xs text-gray-400">{s.village}</span>
                      </div>
                    )}
                    {s.distance_km !== undefined && (
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
      <BotNav />
    </div>
  );
}
