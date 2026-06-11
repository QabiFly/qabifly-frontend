"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { TopNav, BotNav } from "@/components/layout/navbar";
import { Plus, Package, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { formatRupee } from "@/lib/utils";
import { toast } from "sonner";

export default function ShopkeeperProductsPage() {
  const router = useRouter();
  const { user, isAuth } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (!isAuth || user?.role !== "SHOPKEEPER") { router.push("/"); return; }
    if (fetched.current) return;
    fetched.current = true;
    api.get("/products/mine/")
      .then(r => {
        const d = r.data.data?.results || r.data.data || [];
        setProducts(Array.isArray(d) ? d : []);
      })
      .catch(() => toast.error("Products load nahi hue"))
      .finally(() => setLoading(false));
  }, [isAuth]);

  const toggle = async (p: any) => {
    const newStatus = p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await api.patch(`/products/${p.id}/update/`, { status: newStatus });
      setProducts(ps => ps.map(x => x.id === p.id ? { ...x, status: newStatus } : x));
      toast.success(`Product ${newStatus === "ACTIVE" ? "active" : "inactive"} ho gaya`);
    } catch { toast.error("Update nahi hua"); }
  };

  const del = async (p: any) => {
    if (!confirm(`"${p.name}" delete karein?`)) return;
    try {
      await api.delete(`/products/${p.id}/delete/`);
      setProducts(ps => ps.filter(x => x.id !== p.id));
      toast.success("Product delete ho gaya");
    } catch { toast.error("Delete nahi hua"); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-extrabold text-gray-900">Mere Products</h1>
          <button onClick={() => router.push("/shopkeeper/products/add")}
            className="grad text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-200">
            <Plus size={14} /> Add Product
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <Package size={48} className="text-gray-200 mx-auto mb-4" />
            <h3 className="font-extrabold text-gray-900 text-lg mb-1">Koi Product Nahi</h3>
            <p className="text-gray-400 text-sm mb-5">Pehla product add karein</p>
            <button onClick={() => router.push("/shopkeeper/products/add")}
              className="grad text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-purple-200">
              + Product Add Karein
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p:any) => (
              <div key={p.id} className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {p.primary_image
                    ? <img src={p.primary_image} alt={p.name} className="w-full h-full object-cover rounded-xl" />
                    : <Package size={22} className="text-gray-300" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 truncate">{p.name}</h3>
                  <p className="text-purple-600 font-extrabold text-sm">{formatRupee(p.price)}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      p.status === "ACTIVE" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                    }`}>
                      {p.status}
                    </span>
                    <span className="text-[10px] text-gray-400">Stock: {p.stock}</span>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => toggle(p)}
                    className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                    {p.status === "ACTIVE"
                      ? <EyeOff size={14} className="text-gray-400" />
                      : <Eye size={14} className="text-green-500" />
                    }
                  </button>
                  <button onClick={() => router.push(`/shopkeeper/products/edit/${p.id}`)}
                    className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Edit size={14} className="text-blue-500" />
                  </button>
                  <button onClick={() => del(p)}
                    className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BotNav />
    </div>
  );
}
