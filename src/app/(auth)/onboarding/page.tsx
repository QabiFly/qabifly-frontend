"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Btn } from "@/components/ui/button";
import { Camera, MapPin, Search, Check } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { setUser, isAuth } = useAuthStore();
  const [step, setStep] = useState(1);
  const [load, setLoad] = useState(false);
  const [codes, setCodes] = useState < { code: string;location: string } [] > ([]);
  const [search, setSearch] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("Uttar Pradesh");
  const [sc, setSc] = useState("");
  const [vname, setVname] = useState("");
  const [photo, setPhoto] = useState < File | null > (null);
  const [preview, setPreview] = useState("");
  const fileRef = useRef < HTMLInputElement > (null);
  
  useEffect(() => {
    if (!isAuth) router.push("/login");
    authApi.stations()
      .then((r) => setCodes(r.data.data || []))
      .catch(() => {});
  }, [isAuth]);
  
  const statesAndUTs = [
  // 28 States
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  
  // 8 Union Territories
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];
  
  const filtered = codes.filter(
    (c) =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.location.toLowerCase().includes(search.toLowerCase())
  );
  
  const submit = async () => {
    if (!vname.trim()) { toast.error("Enter name for your Virtual number"); return; }
    setLoad(true);
    try {
      const fd = new FormData();
      fd.append("virtual_name", vname.trim());
      fd.append("village", village.trim());
      fd.append("district", district.trim());
      fd.append("state", state);
      fd.append("station_code", sc);
      if (photo) fd.append("virtual_photo", photo);
      
      const r = await authApi.onboarding(fd);
      setUser(r.data.data);
      toast.success(`Welcome! Number: ${r.data.data.virtual_number} 🎉`);
      
      const role = r.data.data.role;
      if (role === "SHOPKEEPER") router.push("/shopkeeper/dashboard");
      else if (role === "DELIVERY_BOY") router.push("/delivery/dashboard");
      else router.push("/");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Something went wrong!");
    } finally { setLoad(false); }
  };
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="grad px-5 pt-12 pb-8 text-white">
        <h1 className="text-xl font-extrabold">QabiFly Setup</h1>
        <p className="text-white/70 text-sm mt-1">Create Virtual account</p>
        <div className="flex gap-2 mt-5">
          {[1,2,3].map((s) => (
            <div key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                step >= s ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          {["📍 Location","🚉 Station","👤 Profile"].map((l, i) => (
            <span key={l}
              className={`text-[11px] font-medium ${
                step >= i+1 ? "text-white" : "text-white/40"
              }`}>
              {l}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-sm mx-auto px-4 py-6">

        {/* Step 1 */}
        {step === 1 && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <MapPin className="text-purple-500" size={20} />
              <div>
                <h2 className="font-extrabold text-gray-900">Where are you from?</h2>
                <p className="text-xs text-gray-400">Get virtual number based on your address</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { l:"Village / Town *", v:village, s:setVillage, p:"e.g. Reoti" },
                { l:"District *",       v:district,s:setDistrict,p:"e.g. Ballia" },
              ].map((f) => (
                <div key={f.l}>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{f.l}</label>
                  <input value={f.v} onChange={(e) => f.s(e.target.value)}
                    placeholder={f.p}
                    className="w-full bg-white rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400 shadow-sm" />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">State</label>
                <select value={state} onChange={(e) => setState(e.target.value)}
                  className="w-full bg-white rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400 shadow-sm">
                  {states.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <Btn fullWidth onClick={() => {
              if (!village.trim() || !district.trim()) {
                toast.error("Village and district are required"); return;
              }
              setStep(2);
            }} className="mt-6 py-3.5">
              Next →
            </Btn>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <h2 className="font-extrabold text-gray-900 mb-1">🚉 Select Station Code</h2>
            <p className="text-xs text-gray-400 mb-3">
              Virtual number format:{" "}
              <span className="font-mono font-bold text-purple-600">@ROI00786</span>
            </p>

            {sc && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-2.5 text-center mb-3">
                <p className="text-xs text-purple-500 font-semibold">Your number is:</p>
                <p className="text-lg font-extrabold text-purple-700 font-mono">
                  @{sc}XXXXX
                </p>
              </div>
            )}

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search station or city..."
                className="w-full bg-white rounded-xl pl-9 pr-4 py-2.5 text-sm border border-gray-200 outline-none focus:border-purple-400 shadow-sm" />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1.5 scrollbar-hide">
              {filtered.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-4">
                  No station found
                </p>
              )}
              {filtered.map((c) => (
                <button key={c.code} onClick={() => setSc(c.code)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${
                    sc === c.code
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  }`}>
                  <div>
                    <span className="font-extrabold text-gray-900 font-mono text-sm">
                      @{c.code}
                    </span>
                    <span className="text-gray-500 text-sm ml-2">{c.location}</span>
                  </div>
                  {sc === c.code && (
                    <Check size={16} className="text-purple-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-5">
              <Btn variant="outline" onClick={() => setStep(1)} className="flex-1">← Back</Btn>
              <Btn onClick={() => {
                if (!sc) { toast.error("Select station code"); return; }
                setStep(3);
              }} className="flex-1">Next →</Btn>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div>
            <h2 className="font-extrabold text-gray-900 mb-1">👤 Virtual Profile</h2>
            <p className="text-xs text-gray-400 mb-5">
              public facing name
            </p>

            {/* Photo */}
            <div className="flex justify-center mb-5">
              <button type="button" onClick={() => fileRef.current?.click()} className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gray-100 border-2 border-dashed border-purple-300 flex items-center justify-center overflow-hidden">
                  {preview ? (
                    <img src={preview} alt="" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <div className="text-center">
                      <Camera size={24} className="text-purple-400 mx-auto mb-1" />
                      <span className="text-xs text-gray-400">Photo</span>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 grad rounded-full flex items-center justify-center shadow">
                  <Camera size={12} className="text-white" />
                </div>
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 2 * 1024 * 1024) {
                    toast.error("Image must be less than 2MB"); return;
                  }
                  setPhoto(f);
                  setPreview(URL.createObjectURL(f));
                }}
                className="hidden" />
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Virtual Name * (Publically access)
              </label>
              <input value={vname} onChange={(e) => setVname(e.target.value)}
                placeholder="e.g. Arman ROI"
                className="w-full bg-white rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400 shadow-sm" />
            </div>

            {/* Preview */}
            <div className="grad rounded-2xl p-4 text-white mb-5 shadow-lg shadow-purple-200">
              <p className="text-xs text-white/60">Your new QabiFly Account</p>
              <p className="font-extrabold text-lg mt-1 leading-tight">
                {vname || " Give your Name..."}
              </p>
              <p className="font-mono text-sm text-white/80">@{sc}XXXXX</p>
              <p className="text-xs text-white/60 mt-1">
                📍 {village}, {district}
              </p>
            </div>

            <div className="flex gap-3">
              <Btn variant="outline" onClick={() => setStep(2)} className="flex-1">← Back</Btn>
              <Btn onClick={submit} loading={load} className="flex-1">Complete ✓</Btn>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
