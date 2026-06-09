"use client";
import { useEffect, useState, useRef } from "react";
import { videoApi } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import { Play, ExternalLink } from "lucide-react";

export default function VideosPage() {
  const [videos,  setVideos]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("ALL");
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    videoApi.get()
      .then((r) => {
        const d = r.data.data?.results || r.data.data || [];
        setVideos(Array.isArray(d) ? d : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const tabs = ["ALL", "FARMERS", "GENERAL"];
  const filtered = tab === "ALL"
    ? videos
    : videos.filter((v: any) => v.audience === tab);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 pb-24">

        <h1 className="text-xl font-extrabold text-gray-900 mb-4">
          Kisan Videos 🎬
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                tab === t
                  ? "grad text-white border-transparent"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}>
              {t === "ALL" ? "🌟 Sab" : t === "FARMERS" ? "🌾 Kisan" : "📚 General"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <span className="text-4xl">🎬</span>
            <p className="text-gray-400 text-sm mt-3">Koi video nahi</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((v: any) => (
              <a key={v.id}
                href={`https://youtube.com/watch?v=${v.youtube_id}`}
                target="_blank" rel="noopener noreferrer"
                className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
              >
                <div className="relative h-44 bg-gray-100">
                  {v.thumbnail_url ? (
                    <img src={v.thumbnail_url} alt={v.title}
                      className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grad flex items-center justify-center">
                      <Play size={40} className="text-white" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Play size={20} className="text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                  {v.duration && (
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {v.duration}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {v.category_name && (
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                          {v.category_name}
                        </span>
                      )}
                      <h3 className="font-bold text-sm text-gray-900 mt-1.5 leading-snug line-clamp-2">
                        {v.title}
                      </h3>
                    </div>
                    <ExternalLink size={14} className="text-gray-300 flex-shrink-0 mt-1" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
      <BotNav />
    </div>
  );
}