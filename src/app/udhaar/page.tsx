"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { udhaarApi } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import { BookOpen, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { formatRupee } from "@/lib/utils";
import { toast } from "sonner";

export default function UdhaarPage() {
  const router     = useRouter();
  const { isAuth } = useAuthStore();
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (!isAuth) { router.push("/login"); return; }
    if (fetched.current) return;
    fetched.current = true;

    udhaarApi.get()
      .then((r) => setData(r.data.data))
      .catch(() => toast.error("Udhaar load nahi hua"))
      .finally(() => setLoading(false));
  }, [isAuth]);

  const statusConfig = {
    ACTIVE:  { color: "#D97706", bg: "#FFFBEB", icon: Clock,         label: "Active"  },
    OVERDUE: { color: "#EF4444", bg: "#FEF2F2", icon: AlertCircle,   label: "Overdue" },
    PAID:    { color: "#059669", bg: "#F0FDF4", icon: CheckCircle,   label: "Paid"    },
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 pb-24">

        <h1 className="text-xl font-extrabold text-gray-900 mb-4">
          Digital Khata 📒
        </h1>

        {loading ? (
          <div className="space-y-3">
            {[1,2].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : !data ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <BookOpen size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Koi udhaar record nahi</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-amber-600 font-bold uppercase tracking-wide mb-1">
                  Total Udhaar
                </p>
                <p className="text-2xl font-extrabold text-amber-700">
                  {formatRupee(data.total_udhaar || "0")}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-red-500 font-bold uppercase tracking-wide mb-1">
                  Overdue
                </p>
                <p className="text-2xl font-extrabold text-red-600">
                  {formatRupee(data.overdue_amount || "0")}
                </p>
              </div>
            </div>

            {/* Records */}
            <h2 className="font-extrabold text-gray-900 mb-3">Records</h2>
            {(data.records || data.results || []).length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl shadow-sm">
                <p className="text-gray-400 text-sm">Koi record nahi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(data.records || data.results || []).map((r: any) => {
                  const cfg = statusConfig[r.status as keyof typeof statusConfig]
                    || statusConfig.ACTIVE;
                  const Icon = cfg.icon;
                  return (
                    <div key={r.id}
                      className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-900 text-sm">
                          {r.shop_name || "Shop"}
                        </span>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{ color: cfg.color, backgroundColor: cfg.bg }}
                        >
                          <Icon size={11} />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Outstanding</p>
                          <p className="text-2xl font-extrabold text-amber-700">
                            {formatRupee(r.outstanding_amount || r.amount || "0")}
                          </p>
                        </div>
                        {r.due_date && (
                          <div className="text-right">
                            <p className="text-xs text-gray-400 mb-0.5">Due Date</p>
                            <p className="text-sm font-bold text-gray-700">
                              {new Date(r.due_date).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric"
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                      {r.status === "OVERDUE" && (
                        <div className="mt-3 bg-red-50 rounded-xl p-2.5">
                          <p className="text-xs text-red-600 font-medium">
                            ⚠️ Yeh udhaar overdue ho gaya hai. Shopkeeper se baat karein.
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