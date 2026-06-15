"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import {
  Shield, Camera, CheckCircle,
  Upload, ArrowLeft, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

type DocType = "aadhaar_front"|"aadhaar_back"|"pan_card"|"selfie";

export default function KYCPage() {
  const router           = useRouter();
  const { user, isAuth } = useAuthStore();
  const [docs,    setDocs]    = useState<Record<DocType, File|null>>({
    aadhaar_front: null, aadhaar_back: null, pan_card: null, selfie: null,
  });
  const [previews,setPreviews]= useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [step,    setStep]    = useState<"upload"|"review"|"done">("upload");
  const refs = {
    aadhaar_front: useRef<HTMLInputElement>(null),
    aadhaar_back:  useRef<HTMLInputElement>(null),
    pan_card:      useRef<HTMLInputElement>(null),
    selfie:        useRef<HTMLInputElement>(null),
  };

  if (!isAuth) { router.push("/login"); return null; }

  const handleFile = (key: DocType, file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("File 5MB se chhoti honi chahiye"); return; }
    setDocs(p => ({ ...p, [key]: file }));
    setPreviews(p => ({ ...p, [key]: URL.createObjectURL(file) }));
  };

  const submit = async () => {
    const required: DocType[] = ["aadhaar_front", "aadhaar_back", "selfie"];
    const missing = required.filter(k => !docs[k]);
    if (missing.length) {
      toast.error("Aadhaar (front + back) aur selfie zaroori hain"); return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      (Object.entries(docs) as [DocType, File|null][]).forEach(([k, v]) => {
        if (v) fd.append(k, v);
      });
      await api.post("/kyc/submit/", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setStep("done");
      toast.success("✅ KYC submit ho gaya! 24-48 hrs mein verify hoga.");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "KYC submit nahi hua");
    } finally { setLoading(false); }
  };

  const documents = [
    { key: "aadhaar_front" as DocType, label: "Aadhaar Card — Front *", e: "🪪", req: true  },
    { key: "aadhaar_back"  as DocType, label: "Aadhaar Card — Back *",  e: "🪪", req: true  },
    { key: "pan_card"      as DocType, label: "PAN Card (optional)",     e: "💳", req: false },
    { key: "selfie"        as DocType, label: "Selfie with Aadhaar *",   e: "🤳", req: true  },
  ];

  if (step === "done") return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-16 pb-24 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-3xl mx-auto mb-5 flex items-center justify-center">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">KYC Submitted!</h2>
        <p className="text-gray-400 text-sm mb-2 leading-relaxed">
          Documents review ke liye bhej diye gaye hain.<br />
          <strong>24-48 ghante</strong> mein verify hoga.
        </p>
        <p className="text-xs text-gray-300 mb-8">
          Email par confirmation milega.
        </p>
        <button onClick={() => router.push("/profile")}
          className="grad text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-purple-200">
          Profile pe Jao
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
          <ArrowLeft size={14} /> Wapas
        </button>

        {/* Header */}
        <div className="grad rounded-3xl p-5 mb-5 text-white shadow-xl shadow-purple-300/30">
          <Shield size={28} className="text-white/80 mb-2" />
          <h1 className="font-extrabold text-xl">KYC Verification</h1>
          <p className="text-white/70 text-sm mt-1">
            Identity verify karein aur full features unlock karein
          </p>
          <div className="flex gap-2 mt-4">
            {["Upload Docs","Review","Done"].map((s, i) => (
              <div key={s} className={`flex-1 text-center ${i <= ["upload","review","done"].indexOf(step) ? "opacity-100" : "opacity-40"}`}>
                <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold mb-1 ${
                  i <= ["upload","review","done"].indexOf(step) ? "bg-white text-purple-600" : "bg-white/20 text-white"
                }`}>{i+1}</div>
                <p className="text-[9px] text-white/80">{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 mb-5">
          <p className="text-xs font-bold text-purple-700 mb-2">KYC se milega:</p>
          {[
            "✅ Verified badge profile pe",
            "✅ Wallet withdrawal enable",
            "✅ Higher transaction limits",
            "✅ Shopkeeper application",
          ].map(b => (
            <p key={b} className="text-xs text-purple-600 mb-1">{b}</p>
          ))}
        </div>

        {/* Document Upload */}
        <div className="space-y-3 mb-5">
          {documents.map((doc) => (
            <div key={doc.key} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{doc.e}</span>
                <div>
                  <p className="font-bold text-sm text-gray-900">{doc.label}</p>
                  <p className="text-xs text-gray-400">JPG, PNG, PDF — Max 5MB</p>
                </div>
                {docs[doc.key] && (
                  <CheckCircle size={18} className="text-green-500 ml-auto flex-shrink-0" />
                )}
              </div>

              {previews[doc.key] ? (
                <div className="relative">
                  <img src={previews[doc.key]} alt=""
                    className="w-full h-40 object-cover rounded-xl" />
                  <button onClick={() => refs[doc.key].current?.click()}
                    className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
                    <span className="bg-white text-gray-700 font-bold text-xs px-3 py-1.5 rounded-lg">
                      Change
                    </span>
                  </button>
                </div>
              ) : (
                <button onClick={() => refs[doc.key].current?.click()}
                  className="w-full h-32 border-2 border-dashed border-purple-200 bg-purple-50 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-purple-400 transition-all">
                  <Upload size={24} className="text-purple-400" />
                  <span className="text-xs text-gray-400 font-medium">Tap to upload</span>
                </button>
              )}
              <input ref={refs[doc.key]} type="file" accept="image/*,application/pdf" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(doc.key, e.target.files[0])} />
            </div>
          ))}
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
          <div className="flex items-start gap-2">
            <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Documents clear aur readable hone chahiye.
              Blurry ya incomplete documents reject ho sakte hain.
              Sab info private rakhi jayegi.
            </p>
          </div>
        </div>

        <button onClick={submit} disabled={loading}
          className="w-full grad text-white font-extrabold py-4 rounded-2xl shadow-xl shadow-purple-300/40 flex items-center justify-center gap-2 disabled:opacity-60">
          {loading
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <><Shield size={18} /> KYC Submit Karein</>
          }
        </button>
      </div>
      <BotNav />
    </div>
  );
}
