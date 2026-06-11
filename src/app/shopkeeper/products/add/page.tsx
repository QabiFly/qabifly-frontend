"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { TopNav } from "@/components/layout/navbar";
import { ArrowLeft, Camera, Package, Plus, X } from "lucide-react";
import { toast } from "sonner";

export default function AddProductPage() {
  const router = useRouter();
  const { user, isAuth } = useAuthStore();
  const [cats,    setCats]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [images,  setImages]  = useState<File[]>([]);
  const [previews,setPreviews]= useState<string[]>([]);
  const imgRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "", description: "", category: "",
    price: "", discount_percent: "0",
    stock: "", unit: "piece", is_featured: false,
  });

  useEffect(() => {
    if (!isAuth || user?.role !== "SHOPKEEPER") { router.push("/"); return; }
    api.get("/products/categories/")
      .then(r => setCats(r.data.data || []))
      .catch(() => {});
  }, [isAuth]);

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const addImages = (files: FileList) => {
    const newFiles = Array.from(files).slice(0, 5 - images.length);
    setImages(p => [...p, ...newFiles]);
    setPreviews(p => [...p, ...newFiles.map(f => URL.createObjectURL(f))]);
  };

  const removeImg = (i: number) => {
    setImages(p => p.filter((_,j) => j !== i));
    setPreviews(p => p.filter((_,j) => j !== i));
  };

  const submit = async () => {
    if (!form.name || !form.category || !form.price || !form.stock) {
      toast.error("Sab zaroori fields bhar dijiye"); return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name",             form.name);
      fd.append("description",      form.description);
      fd.append("category",         form.category);
      fd.append("price",            form.price);
      fd.append("discount_percent", form.discount_percent);
      fd.append("stock",            form.stock);
      fd.append("unit",             form.unit);
      fd.append("is_featured",      String(form.is_featured));

      images.forEach((img, i) => {
        fd.append("product_images", img);
      });

      const r = await api.post("/products/create/", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success("✅ Product add ho gaya!");
      router.push("/shopkeeper/products");
    } catch (e: any) {
      const err = e.response?.data;
      const msg = typeof err === "object"
        ? Object.values(err).flat().join(", ")
        : err?.message || "Product create nahi hua";
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const units = ["piece","kg","gram","litre","ml","dozen","box","pack","meter","pair"];

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4">
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-gray-400 text-sm mb-4">
          <ArrowLeft size={14} /> Wapas
        </button>
        <h1 className="text-xl font-extrabold text-gray-900 mb-4">
          Product Add Karein 📦
        </h1>

        {/* Images */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">
            Product Photos (max 5)
          </h3>
          <div className="flex gap-2 flex-wrap">
            {previews.map((p, i) => (
              <div key={i} className="relative w-20 h-20">
                <img src={p} alt="" className="w-full h-full object-cover rounded-xl" />
                <button onClick={() => removeImg(i)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <X size={10} className="text-white" />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center rounded-b-xl py-0.5">
                    Primary
                  </span>
                )}
              </div>
            ))}
            {images.length < 5 && (
              <button onClick={() => imgRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed border-purple-300 bg-purple-50 rounded-xl flex flex-col items-center justify-center">
                <Camera size={18} className="text-purple-400 mb-0.5" />
                <span className="text-[10px] text-gray-400">Add Photo</span>
              </button>
            )}
            <input ref={imgRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => e.target.files && addImages(e.target.files)} />
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 space-y-3">
          <h3 className="font-extrabold text-gray-900">Product Info</h3>

          {[
            { l:"Product ka Naam *", k:"name",        p:"e.g. Atta 10kg"      },
          ].map(f => (
            <div key={f.k}>
              <label className="text-xs font-semibold text-gray-600 block mb-1">{f.l}</label>
              <input value={(form as any)[f.k]} onChange={e => set(f.k, e.target.value)}
                placeholder={f.p}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400" />
            </div>
          ))}

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Product ke baare mein likho..."
              rows={3}
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400 resize-none" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Category *</label>
            <select value={form.category} onChange={e => set("category", e.target.value)}
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400">
              <option value="">Category chunein</option>
              {cats.map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Unit</label>
            <select value={form.unit} onChange={e => set("unit", e.target.value)}
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400">
              {units.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 space-y-3">
          <h3 className="font-extrabold text-gray-900">Pricing & Stock</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Price (₹) *</label>
              <input type="number" value={form.price} onChange={e => set("price", e.target.value)}
                placeholder="0.00" min="0"
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Discount %</label>
              <input type="number" value={form.discount_percent} onChange={e => set("discount_percent", e.target.value)}
                placeholder="0" min="0" max="100"
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Stock Quantity *</label>
            <input type="number" value={form.stock} onChange={e => set("stock", e.target.value)}
              placeholder="100" min="0"
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400" />
          </div>
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-bold text-gray-900">Featured Product?</p>
              <p className="text-xs text-gray-400">Home page pe dikhega</p>
            </div>
            <button onClick={() => set("is_featured", !form.is_featured)}
              className={`w-12 h-6 rounded-full transition-all ${form.is_featured ? "grad" : "bg-gray-200"}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-all mx-auto ${form.is_featured ? "translate-x-3" : "-translate-x-3"}`} />
            </button>
          </div>
        </div>

        <button onClick={submit} disabled={loading}
          className="w-full grad text-white font-extrabold py-4 rounded-2xl shadow-xl shadow-purple-300/40 flex items-center justify-center gap-2 disabled:opacity-60">
          {loading
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <><Package size={18} /> Product Add Karein</>
          }
        </button>
      </div>
    </div>
  );
}
