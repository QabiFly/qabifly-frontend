"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { walletApi } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import {
  Wallet, ArrowUpRight, ArrowDownLeft,
  Plus, X, Copy, CheckCircle, ExternalLink,
} from "lucide-react";
import { formatRupee, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

const UPI_ID = "6387403745@fam";

export default function WalletPage() {
  const router     = useRouter();
  const { isAuth } = useAuthStore();
  const [wallet,  setWallet]  = useState<any>(null);
  const [txns,    setTxns]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [step,    setStep]    = useState<1|2>(1); // 1=UPI pay, 2=UTR enter
  const [show,    setShow]    = useState(false);
  const [amount,  setAmount]  = useState("");
  const [utr,     setUtr]     = useState("");
  const [adding,  setAdding]  = useState(false);
  const [copied,  setCopied]  = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (!isAuth) { router.push("/login"); return; }
    if (fetched.current) return;
    fetched.current = true;

    Promise.all([walletApi.get(), walletApi.txns()])
      .then(([wr, tr]) => {
        setWallet(wr.data.data);
        const d = tr.data.data?.results || tr.data.data || [];
        setTxns(Array.isArray(d) ? d : []);
      })
      .catch(() => toast.error("Wallet load nahi hua"))
      .finally(() => setLoading(false));
  }, [isAuth]);

  const copyUPI = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    toast.success("UPI ID copy ho gaya!");
    setTimeout(() => setCopied(false), 2000);
  };

  const openUPIApp = () => {
    // UPI deep link — GPay/PhonePe mein directly khulega
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=QabiFly&am=${amount}&cu=INR`;
    window.open(upiLink, "_blank");
  };

  const handleTopup = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Valid amount daalen"); return;
    }
    if (!utr || utr.trim().length < 6) {
      toast.error("UTR/Transaction ID daalen"); return;
    }
    setAdding(true);
    try {
      await walletApi.topup(parseFloat(amount), utr.trim());
      toast.success("✅ Topup request submit ho gaya! Admin 24hr mein verify karega.");
      setShow(false);
      setAmount(""); setUtr(""); setStep(1);
      // Refresh wallet
      const r = await walletApi.get();
      setWallet(r.data.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Topup submit nahi hua");
    } finally { setAdding(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 pb-24">

        <h1 className="text-xl font-extrabold text-gray-900 mb-4">
          Mera Wallet 💰
        </h1>

        {loading ? (
          <div className="space-y-3">
            <div className="h-44 bg-gray-200 rounded-3xl animate-pulse" />
          </div>
        ) : (
          <>
            {/* Balance Card */}
            <div className="grad rounded-3xl p-5 mb-5 text-white shadow-xl shadow-purple-300/30">
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={18} className="text-white/70" />
                <span className="text-white/70 text-sm font-medium">QabiFly Wallet</span>
              </div>
              <p className="text-white/60 text-xs mb-1">Available Balance</p>
              <h2 className="text-4xl font-extrabold mb-1">
                {formatRupee(wallet?.balance || "0")}
              </h2>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setShow(true); setStep(1); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-white text-purple-600 text-sm font-bold py-2.5 rounded-xl shadow-md hover:bg-purple-50 transition-all"
                >
                  <Plus size={15} /> Add Money
                </button>
                <button
                  onClick={() => toast.info("Withdraw feature coming soon")}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/20 border border-white/30 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-white/30 transition-all"
                >
                  <ArrowUpRight size={15} /> Withdraw
                </button>
              </div>
            </div>

            {/* Add Money Modal */}
            {show && (
              <div className="bg-white rounded-2xl shadow-lg border border-purple-100 mb-4 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h3 className="font-extrabold text-gray-900">💳 Add Money</h3>
                  <button
                    onClick={() => { setShow(false); setStep(1); setAmount(""); setUtr(""); }}
                    className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center"
                  >
                    <X size={14} className="text-gray-500" />
                  </button>
                </div>

                {/* Steps indicator */}
                <div className="flex gap-0 px-4 pt-3 mb-1">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      step >= 1 ? "grad text-white" : "bg-gray-100 text-gray-400"
                    }`}>1</div>
                    <span className={`text-xs font-semibold ${step >= 1 ? "text-purple-600" : "text-gray-400"}`}>
                      UPI se Bhejo
                    </span>
                  </div>
                  <div className="flex-1 h-0.5 bg-gray-100 self-center mx-2" />
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      step >= 2 ? "grad text-white" : "bg-gray-100 text-gray-400"
                    }`}>2</div>
                    <span className={`text-xs font-semibold ${step >= 2 ? "text-purple-600" : "text-gray-400"}`}>
                      UTR Daalen
                    </span>
                  </div>
                </div>

                <div className="p-4">

                  {/* Step 1 — Amount + UPI Pay */}
                  {step === 1 && (
                    <div>
                      <div className="mb-3">
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                          Kitna add karna hai?
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 font-bold text-sm">₹</span>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="100"
                            className="w-full bg-gray-50 rounded-xl pl-8 pr-4 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400 font-bold text-lg"
                          />
                        </div>
                        {/* Quick amounts */}
                        <div className="flex gap-2 mt-2">
                          {["50","100","200","500"].map((a) => (
                            <button key={a} onClick={() => setAmount(a)}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                amount === a
                                  ? "border-purple-500 bg-purple-50 text-purple-600"
                                  : "border-gray-200 text-gray-500 hover:border-gray-300"
                              }`}>
                              ₹{a}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* UPI ID Box */}
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-4 mb-3">
                        <p className="text-xs text-gray-500 mb-1 font-medium">
                          Neeche diye UPI ID pe transfer karein:
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-extrabold text-purple-700 text-lg">
                            {UPI_ID}
                          </span>
                          <button onClick={copyUPI}
                            className="flex items-center gap-1 bg-white border border-purple-200 px-3 py-1.5 rounded-lg text-xs font-bold text-purple-600 shadow-sm">
                            {copied
                              ? <><CheckCircle size={12} className="text-green-500" /> Copied!</>
                              : <><Copy size={12} /> Copy</>
                            }
                          </button>
                        </div>
                      </div>

                      {/* Open UPI App */}
                      {amount && parseFloat(amount) > 0 && (
                        <button
                          onClick={openUPIApp}
                          className="w-full flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 font-bold py-3 rounded-xl text-sm mb-3"
                        >
                          <ExternalLink size={15} />
                          GPay / PhonePe mein open karein — ₹{amount}
                        </button>
                      )}

                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                        <p className="text-xs text-amber-700 font-medium leading-relaxed">
                          ⚠️ <strong>Important:</strong> Transfer hone ke baad jo{" "}
                          <strong>UTR/Reference number</strong> milega woh next step mein dalna hoga.
                          UTR number apni payment history mein milega.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          if (!amount || parseFloat(amount) <= 0) {
                            toast.error("Pehle amount daalen"); return;
                          }
                          setStep(2);
                        }}
                        className="w-full grad text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-200"
                      >
                        Maine Transfer Kar Diya → UTR Daalen
                      </button>
                    </div>
                  )}

                  {/* Step 2 — UTR Entry */}
                  {step === 2 && (
                    <div>
                      <div className="bg-purple-50 rounded-xl p-3 mb-4">
                        <p className="text-xs text-purple-700 font-semibold">
                          Amount: <span className="font-extrabold text-lg">₹{amount}</span>
                        </p>
                        <p className="text-xs text-purple-500 mt-1">
                          UPI ID: {UPI_ID}
                        </p>
                      </div>

                      <div className="mb-2">
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                          UTR / Transaction Reference Number *
                        </label>
                        <input
                          type="text"
                          value={utr}
                          onChange={(e) => setUtr(e.target.value)}
                          placeholder="e.g. 424242424242"
                          className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400 font-mono"
                        />
                      </div>

                      <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                        UTR number kahan milega:{" "}
                        <strong>GPay</strong> → Transaction History → Receipt → UTR Number |{" "}
                        <strong>PhonePe</strong> → History → Transaction → Ref ID
                      </p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setStep(1)}
                          className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm"
                        >
                          ← Wapas
                        </button>
                        <button
                          onClick={handleTopup}
                          disabled={adding}
                          className="flex-1 py-3 grad text-white font-bold rounded-xl text-sm disabled:opacity-60 shadow-lg shadow-purple-200"
                        >
                          {adding ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                          ) : "Submit ✓"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transactions */}
            <h2 className="font-extrabold text-gray-900 mb-3">Transactions</h2>
            {txns.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <Wallet size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Koi transaction nahi</p>
                <p className="text-gray-400 text-xs mt-1">
                  Add money karein aur orders karo
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {txns.map((t: any) => (
                  <div key={t.id}
                    className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      t.transaction_type === "CREDIT" ? "bg-green-50" : "bg-red-50"
                    }`}>
                      {t.transaction_type === "CREDIT"
                        ? <ArrowDownLeft size={16} className="text-green-600" />
                        : <ArrowUpRight size={16} className="text-red-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {t.description || t.transaction_type}
                      </p>
                      <p className="text-xs text-gray-400">{timeAgo(t.created_at)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`font-extrabold text-sm block ${
                        t.transaction_type === "CREDIT" ? "text-green-600" : "text-red-500"
                      }`}>
                        {t.transaction_type === "CREDIT" ? "+" : "-"}
                        {formatRupee(t.amount)}
                      </span>
                      {t.status && (
                        <span className={`text-[10px] font-bold ${
                          t.status === "COMPLETED" ? "text-green-500" :
                          t.status === "PENDING"   ? "text-amber-500" :
                          "text-red-400"
                        }`}>
                          {t.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <BotNav />
    </div>
  );
}