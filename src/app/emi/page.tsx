// src/app/emi/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGuard } from "@/lib/auth-guard";
import { api } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import { CreditCard, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { formatRupee } from "@/lib/utils";
import { toast } from "sonner";

export default function EMIPage() {
  const router = useRouter();
  const { ready } = useGuard();
  const [emis,    setEmis]    = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    api.get("/emi/mine/")
      .then((r) => {
        const d = r.data?.data;
        if (d?.emis || d?.results) {
          setEmis(d.emis || d.results || []);
          setSummary(d);
        } else if (Array.isArray(d)) {
          setEmis(d);
        }
      })
      .catch((e) => {
        if (e.response?.status === 404) setEmis([]);
        else toast.error("EMI load nahi hua");
      })
      .finally(() => setLoading(false));
  }, [ready]);

  const STATUS: Record<string, any> = {
    ACTIVE:   { c:"text-blue-600",   b:"bg-blue-50",   I:Clock,       l:"Active"   },
    OVERDUE:  { c:"text-red-500",    b:"bg-red-50",    I:AlertCircle, l:"Overdue"  },
    PAID:     { c:"text-green-600",  b:"bg-green-50",  I:CheckCircle, l:"Paid"     },
    PENDING:  { c:"text-amber-600",  b:"bg-amber-50",  I:Clock,       l:"Pending"  },
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 pb-24">
        <h1 className="text-xl font-extrabold text-gray-900 mb-4">EMI Plans 💳</h1>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <>
            {summary && (
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-xs font-bold text-blue-500 mb-1">TOTAL EMI</p>
                  <p className="text-2xl font-extrabold text-blue-700">
                    {formatRupee(summary.total_emi_amount || 0)}
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-xs font-bold text-red-500 mb-1">OVERDUE</p>
                  <p className="text-2xl font-extrabold text-red-600">
                    {formatRupee(summary.overdue_amount || 0)}
                  </p>
                </div>
              </div>
            )}

            {emis.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                <CreditCard size={48} className="text-gray-200 mx-auto mb-4" />
                <h3 className="font-extrabold text-gray-900 mb-1">Koi EMI Nahi</h3>
                <p className="text-gray-400 text-sm">Abhi koi active EMI plan nahi hai</p>
              </div>
            ) : (
              <div className="space-y-3">
                {emis.map((e: any) => {
                  const s = STATUS[e.status] || STATUS.PENDING;
                  const Icon = s.I;
                  const dueDate = e.next_due_date || e.due_date;
                  const daysLeft = dueDate
                    ? Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000)
                    : null;
                  return (
                    <div key={e.id} className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-900">{e.shop_name || e.product_name || "EMI"}</span>
                        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${s.c} ${s.b}`}>
                          <Icon size={11} /> {s.l}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div>
                          <p className="text-xs text-gray-400">Monthly</p>
                          <p className="font-extrabold text-purple-600">{formatRupee(e.monthly_amount || e.emi_amount || 0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Remaining</p>
                          <p className="font-extrabold text-gray-900">{formatRupee(e.remaining_amount || 0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Installments</p>
                          <p className="font-extrabold text-gray-900">
                            {e.paid_installments || 0}/{e.total_installments || 0}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="bg-gray-100 rounded-full h-2 mb-2">
                        <div
                          className="grad h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(100, ((e.paid_installments||0)/(e.total_installments||1))*100)}%` }}
                        />
                      </div>

                      {dueDate && (
                        <p className={`text-xs font-semibold ${
                          daysLeft! < 0 ? "text-red-500" : daysLeft! <= 3 ? "text-amber-500" : "text-gray-400"
                        }`}>
                          Next due: {new Date(dueDate).toLocaleDateString("en-IN", {day:"numeric",month:"short",year:"numeric"})}
                          {daysLeft !== null && (
                            <span className="ml-2">
                              ({daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue!` : `${daysLeft}d bache`})
                            </span>
                          )}
                        </p>
                      )}

                      {e.status === "OVERDUE" && (
                        <button
                          onClick={() => router.push("/wallet")}
                          className="w-full mt-3 bg-red-50 border border-red-200 text-red-600 font-bold text-xs py-2 rounded-xl">
                          💰 Wallet se Pay Karein
                        </button>
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
