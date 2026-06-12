"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import {
  BookOpen, AlertCircle, CheckCircle,
  Clock, TrendingDown, ChevronRight,
} from "lucide-react";
import { formatRupee, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

export default function UdhaarPage() {
  const router           = useRouter();
  const { isAuth }       = useAuthStore();
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<"all"|"active"|"overdue"|"paid">("all");
  const fetched = useRef(false);

  useEffect(() => {
    if (!isAuth) { router.push("/login"); return; }
    if (fetched.current) return;
    fetched.current = true;
    api.get("/udhaar/mine/")
      .then(r => setData(r.data.data))
      .catch(() => toast.error("Udhaar load nahi hua"))
      .finally(() => setLoading(false));
  }, [isAuth]);

  const STATUS = {
    ACTIVE:  { label:"Active",  c:"text-amber-600",  b:"bg-amber-50",  icon:Clock         },
    OVERDUE: { label:"Overdue", c:"text-red-500",    b:"bg-red-50",    icon:AlertCircle   },
    PAID:    { label:"Paid",    c:"text-green-600",  b:"bg-green-50",  icon:CheckCircle   },
  };

  const records = data?.records || data?.results || [];
  const filtered = tab === "all" ? records : records.filter((r:any) => r.status === tab.toUpperCase());

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 pb-24">

        <h1 className="text-xl font-extrabold text-gray-900 mb-4">
          Digital Khata 📒
        </h1>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />)}
          </div>
        ) : !data ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <BookOpen size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400">Koi udhaar record nahi</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown size={16} className="text-amber-500" />
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">Total Udhaar</p>
                </div>
                <p className="text-2xl font-extrabold text-amber-700">
                  {formatRupee(data.total_udhaar || "0")}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={16} className="text-red-500" />
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wide">Overdue</p>
                </div>
                <p className="text-2xl font-extrabold text-red-600">
                  {formatRupee(data.overdue_amount || "0")}
                </p>
              </div>
            </div>

            {/* Alert if overdue */}
            {parseFloat(data.overdue_amount || "0") > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-700 text-sm">Overdue Amount Hai!</p>
                  <p className="text-xs text-red-500 mt-0.5">
                    {formatRupee(data.overdue_amount)} overdue ho gaya hai. Shopkeeper se baat karein.
                  </p>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              {["all","active","overdue","paid"].map(t => (
                <button key={t} onClick={() => setTab(t as any)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    tab === t ? "grad text-white border-transparent" : "bg-white text-gray-500 border-gray-200"
                  }`}>
                  {t === "all" ? "🌟 All" : t === "active" ? "⏳ Active" : t === "overdue" ? "⚠️ Overdue" : "✅ Paid"}
                </button>
              ))}
            </div>

            {/* Records */}
            {filtered.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                <BookOpen size={36} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Is category mein koi record nahi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((r:any) => {
                  const s = STATUS[r.status as keyof typeof STATUS] || STATUS.ACTIVE;
                  const Icon = s.icon;
                  const daysLeft = r.due_date
                    ? Math.ceil((new Date(r.due_date).getTime() - Date.now()) / 86400000)
                    : null;
                  return (
                    <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-900 text-sm">{r.shop_name}</span>
                        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${s.c} ${s.b}`}>
                          <Icon size={11} /> {s.label}
                        </span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Outstanding</p>
                          <p className="text-2xl font-extrabold text-amber-700">
                            {formatRupee(r.outstanding_amount || r.amount)}
                          </p>
                        </div>
                        {r.due_date && (
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Due Date</p>
                            <p className={`text-sm font-extrabold ${
                              daysLeft !== null && daysLeft < 0
                                ? "text-red-500"
                                : daysLeft !== null && daysLeft <= 3
                                ? "text-amber-500"
                                : "text-gray-700"
                            }`}>
                              {new Date(r.due_date).toLocaleDateString("en-IN", {
                                day:"numeric", month:"short"
                              })}
                            </p>
                            {daysLeft !== null && daysLeft < 0 && (
                              <p className="text-[10px] text-red-500 font-bold">
                                {Math.abs(daysLeft)} din overdue!
                              </p>
                            )}
                            {daysLeft !== null && daysLeft >= 0 && (
                              <p className="text-[10px] text-gray-400">
                                {daysLeft} din bache
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      {r.status === "OVERDUE" && (
                        <div className="mt-3 bg-red-50 rounded-xl p-2.5">
                          <p className="text-xs text-red-600 font-medium">
                            ⚠️ Shopkeeper se contact karein ya payment karein
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      <BotNav />
    </div>
  );
}
