"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { TopNav } from "@/components/layout/navbar";
import { Store, MapPin, Camera, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

export default function CreateShopPage() {
  const router          = useRouter();
  const { user, isAuth } = useAuthStore();
  const [cats,    setCats]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [logo,    setLogo]    = useState<File|null>(null);
  const [banner,  setBanner]  = useState<File|null>(null);
  const [logoP,   setLogoP]   = useState("");
  const [bannerP, setBannerP] = useState("");
  const logoRef   = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "", description: "", category: "",
    address: "", village: "", district: "",
    state: "Uttar Pradesh", pincode: "", gstin: "",
    opening_time: "09:00", closing_time: "21:00",
  });

  useEffect(() => {
    if (!isAuth || user?.role !== "SHOPKEEPER") {
      router.push("/"); return;
    }
    api.get("/shops/categories/")
      .then(r => setCats(r.data.data || []))
      .catch(() => {});
  }, [isAuth]);

  const set = (k: string, v: string) =>
    setForm(p => ({ ...p, [k]: v }));

  const handleFile = (file: File, type: "logo"|"banner") => {
    if (file.size > 5 * 1024 * 1024) { toast.error("File 5MB se chhoti honi chahiye"); return; }
    const url = URL.createObjectURL(file);
    if (type === "logo")   { setLogo(file);   setLogoP(url);   }
    if (type === "banner") { setBanner(file); setBannerP(url); }
  };

  const submit = async () => {
    if (!form.name || !form.category || !form.village || !form.district) {
      toast.error("Zaroori fields bhar dijiye"); return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      if (logo)   fd.append("logo", logo);
      if (banner) fd.append("banner", banner);

      const r = await api.post("/shops/create/", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("🎉 Shop ban gayi! Admin approve karega.");
      router.push("/shopkeeper/dashboard");
    } catch (e: any) {
      const err = e.response?.data;
      const msg = typeof err === "object"
        ? Object.values(err).flat().join(", ")
        : e.response?.data?.message || "Shop create nahi hui";
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const states = [
    "Uttar Pradesh","Bihar","Madhya Pradesh","Rajasthan","Maharashtra",
    "Delhi","West Bengal","Gujarat","Karnataka","Tamil Nadu","Andhra Pradesh",
    "Telangana","Punjab","Haryana","Jharkhand","Chhattisgarh","Odisha",
  ];

  const Field = ({ label, k, placeholder, type="text" }: any) => (
    <div>
      <label className="text-xs font-semibold text-gray-600 block mb-1.5">{label}</label>
      <input type={type} value={form[k as keyof typeof form]}
        onChange={e => set(k, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400 focus:bg-white transition-all" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4">

        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-gray-400 text-sm mb-4 hover:text-gray-600">
          <ArrowLeft size={14} /> Wapas
        </button>

        {/* Header */}
        <div className="grad rounded-3xl p-5 mb-5 text-white shadow-xl shadow-purple-300/30">
          <Store size={28} className="text-white/80 mb-2" />
          <h1 className="font-extrabold text-xl">Apni Shop Banayein</h1>
          <p className="text-white/70 text-sm mt-1">
            QabiFly pe apni dukan kholo aur sell karo
          </p>
        </div>

        {/* Banner Upload */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <button type="button" onClick={() => bannerRef.current?.click()}
            className="w-full relative">
            <div className={`h-32 flex items-center justify-center ${bannerP ? "" : "bg-gradient-to-r from-purple-100 to-blue-100"}`}>
              {bannerP
                ? <img src={bannerP} alt="" className="w-full h-full object-cover" />
                : <div className="text-center">
                    <Camera size={24} className="text-purple-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-400">Banner Upload karein (optional)</p>
                  </div>
              }
            </div>
          </button>
          <input ref={bannerRef} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], "banner")} />

          {/* Logo */}
          <div className="px-4 pb-4 pt-2 flex items-center gap-3">
            <button type="button" onClick={() => logoRef.current?.click()}
              className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50 flex items-center justify-center overflow-hidden">
                {logoP
                  ? <img src={logoP} alt="" className="w-full h-full object-cover rounded-2xl" />
                  : <Store size={22} className="text-purple-400" />
                }
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 grad rounded-full flex items-center justify-center">
                <Camera size={10} className="text-white" />
              </div>
            </button>
            <input ref={logoRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], "logo")} />
            <p className="text-xs text-gray-400 leading-relaxed">
              Logo aur banner upload karein.<br />
              <span className="text-purple-600 font-semibold">Max 5MB, JPG/PNG</span>
            </p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 space-y-3">
          <h3 className="font-extrabold text-gray-900">Basic Info</h3>
          <Field label="Shop ka Naam *"     k="name"        placeholder="e.g. Ramesh General Store" />
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Shop ke baare mein kuch likho..."
              rows={3}
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400 resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Category *</label>
            <select value={form.category} onChange={e => set("category", e.target.value)}
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400">
              <option value="">Category chunein</option>
              {cats.map((c:any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-purple-500" />
            <h3 className="font-extrabold text-gray-900">Location</h3>
          </div>
          <Field label="Address" k="address" placeholder="Gali, Mohalla, Landmark" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Village / Town *" k="village"  placeholder="Reoti" />
            <Field label="District *"       k="district" placeholder="Ballia" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">State</label>
            <select value={form.state} onChange={e => set("state", e.target.value)}
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400">
              {states.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <Field label="Pincode" k="pincode" placeholder="277001" />
        </div>

        {/* Timing */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">Shop Timing</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">Khulne ka Waqt</label>
              <input type="time" value={form.opening_time}
                onChange={e => set("opening_time", e.target.value)}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">Bandh Hone ka Waqt</label>
              <input type="time" value={form.closing_time}
                onChange={e => set("closing_time", e.target.value)}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400" />
            </div>
          </div>
        </div>

        {/* GST */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-5">
          <h3 className="font-extrabold text-gray-900 mb-3">Business Details (Optional)</h3>
          <Field label="GSTIN" k="gstin" placeholder="e.g. 09ABCDE1234F1Z5" />
        </div>

        {/* Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
          <p className="text-xs text-amber-700 leading-relaxed">
            ⚠️ Shop create hone ke baad <strong>Admin approve</strong> karega.
            Approval ke baad hi products add kar sakte hain.
          </p>
        </div>

        {/* Submit */}
        <button onClick={submit} disabled={loading}
          className="w-full grad text-white font-extrabold py-4 rounded-2xl shadow-xl shadow-purple-300/40 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all">
          {loading
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <><Check size={18} /> Shop Banao</>
          }
        </button>
      </div>
    </div>
  );
}
