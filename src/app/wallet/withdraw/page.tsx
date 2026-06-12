"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import { ArrowLeft, ArrowUpRight, CheckCircle, AlertCircle } from "lucide-react";
import { formatRupee } from "@/lib/utils";
import { toast } from "sonner";

export default function WithdrawPage() {
  const router           = useRouter();
  const { user, isAuth } = useAuthStore();
  const [wallet,  setWallet]  = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [done,    setDone]    = useState(false);
  const [amount,  setAmount]  = useState("");
  const [upiId,   setUpiId]   = useState("");
  const [upiName, setUpiName] = useState("");
  const fetched = useRef(false);

  useEffect(() => {
    if (!isAuth) { router.push("/login"); return; }
    if (fetched.current) return;
    fetched.current = true;
    api.get("/wallet/")
      .then(r => setWallet(r.data.data))
      .finally(() => setLoading(false));
  }, [isAuth]);

  const submit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 50) { toast.error("Minimum ₹50 withdraw karein"); return; }
    if (!wallet || amt > parseFloat(wallet.balance)) {
      toast.error("Insufficient balance"); return;
    }
    if (!upiId.trim() || !upiId.includes("@")) {
      toast.error("Valid UPI ID daalen (e.g. 9876543210@ybl)"); return;
    }
    setSending(true);
    try {
      await api.post("/wallet/withdraw/", {
        amount: amt,
        upi_id: upiId.trim(),
        upi_name: upiName.trim() || undefined,
      });
      setDone(true);
      toast.success("✅ Withdrawal request submit! 24hr mein process hoga.");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Withdraw nahi hua");
    } finally { setSending(false); }
  };

  if (done) return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-16 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-3xl mx-auto mb-5 flex items-center justify-center">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Request Submit!</h2>
        <p className="text-gray-400 text-sm mb-2">
          ₹{amount} withdrawal request bheja gaya
        </p>
        <p className="text-xs text-gray-400 mb-1">UPI: {upiId}</p>
        <p className="text-xs text-gray-300 mb-8">Processing: 24-48 ghante</p>
        <button onClick={() => router.push("/wallet")}
          className="grad text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-purple-200">
          Wallet pe Wapas
        </button>
      </div>
      <BotNav />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 pb-24">

        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-gray-400 text-sm mb-4">
          <ArrowLeft size={14} /> Wallet
        </button>

        <h1 className="text-xl font-extrabold text-gray-900 mb-4">
          Paise Nikaalein 💸
        </h1>

        {/* Balance */}
        {!loading && wallet && (
          <div className="grad rounded-2xl p-4 mb-5 text-white text-center shadow-lg shadow-purple-200">
            <p className="text-white/70 text-xs mb-1">Available Balance</p>
            <p className="text-3xl font-extrabold">{formatRupee(wallet.balance)}</p>
          </div>
        )}

        {/* Amount */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 space-y-3">
          <h3 className="font-extrabold text-gray-900">Amount</h3>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Kitna Nikalein? (Min ₹50)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500 font-bold text-lg">₹</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0" min="50"
                className="w-full bg-gray-50 rounded-xl pl-9 pr-4 py-3 text-lg font-bold border border-gray-200 outline-none focus:border-purple-400" />
            </div>
            <div className="flex gap-2 mt-2">
              {["100","200","500","1000"].map(a => (
                <button key={a} onClick={() => setAmount(a)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    amount === a ? "border-purple-500 bg-purple-50 text-purple-600" : "border-gray-200 text-gray-500"
                  }`}>
                  ₹{a}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* UPI Details */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 space-y-3">
          <h3 className="font-extrabold text-gray-900">UPI Details</h3>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">UPI ID *</label>
            <input value={upiId} onChange={e => setUpiId(e.target.value)}
              placeholder="9876543210@ybl"
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-mono border border-gray-200 outline-none focus:border-purple-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Account Name (optional)
            </label>
            <input value={upiName} onChange={e => setUpiName(e.target.value)}
              placeholder="Aapka naam"
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400" />
          </div>
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
          <div className="flex items-start gap-2">
            <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Withdrawal 24-48 ghante mein process hoga. UPI ID sahi daalen.
              Galat UPI pe gaye paise vapas nahi aate.
            </p>
          </div>
        </div>

        <button onClick={submit} disabled={sending || loading}
          className="w-full grad text-white font-extrabold py-4 rounded-2xl shadow-xl shadow-purple-300/40 flex items-center justify-center gap-2 disabled:opacity-60">
          {sending
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <><ArrowUpRight size={18} /> Withdraw Request Bhejein</>
          }
        </button>
      </div>
      <BotNav />
    </div>
  );
}
