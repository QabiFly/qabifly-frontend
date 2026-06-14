"use client";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { TopNav, BotNav } from "@/components/layout/navbar";
import {
  Package, Wallet, BookOpen, LogOut,
  ChevronRight, Shield, Bell, Store,
  Bike, Settings,
} from "lucide-react";
import { authApi } from "@/lib/api";
import Cookies from "js-cookie";
import { toast } from "sonner";

export default function ProfilePage() {
  const router               = useRouter();
  const { user, isAuth, logout } = useAuthStore();

  if (!isAuth) return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TopNav />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center w-full max-w-xs">
          <div className="w-20 h-20 grad rounded-3xl mx-auto mb-5 flex items-center justify-center shadow-xl shadow-purple-200">
            <span className="text-4xl">👤</span>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Login</h2>
          <p className="text-gray-400 text-sm mb-6">
            Join the QabiFly
          </p>
          <button onClick={() => router.push("/login")}
            className="w-full grad text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-200 mb-3">
            Login
          </button>
          <button onClick={() => router.push("/register")}
            className="w-full bg-white border-2 border-purple-200 text-purple-600 font-bold py-3 rounded-xl">
            Create New Account
          </button>
        </div>
      </div>
      <BotNav />
    </div>
  );

  const handleLogout = async () => {
    const refresh = Cookies.get("qf_refresh") || "";
    try { if (refresh) await authApi.logout(refresh); } catch {}
    logout();
    toast.success("Logout Successfully!");
    router.push("/");
  };

  const role = user?.role;

  const menuItems = [
    ...(role === "BUYER" ? [
      { icon: Package,  label: "My Orders",    href: "/orders",  color: "#7C3AED" },
      { icon: Wallet,   label: "Wallet",           href: "/wallet",  color: "#D97706" },
      { icon: BookOpen, label: "Digital Account",   href: "/udhaar",  color: "#92400E" },
      { icon: Bell,     label: "Notifications",    href: "/notifications", color: "#4B7BF5" },
    ] : []),
    ...(role === "SHOPKEEPER" ? [
      { icon: Store,    label: "Shop Dashboard",  href: "/shopkeeper/dashboard", color: "#059669" },
      { icon: Package,  label: "Shop Orders",     href: "/shopkeeper/orders",    color: "#4B7BF5" },
      { icon: Settings, label: "Shop Settings",   href: "/shopkeeper/shop",      color: "#6366F1" },
      { icon: Wallet,   label: "Earnings",         href: "/wallet",               color: "#D97706" },
    ] : []),
    ...(role === "DELIVERY_BOY" ? [
      { icon: Bike,     label: "Delivery Dashboard", href: "/delivery/dashboard", color: "#7C3AED" },
      { icon: Wallet,   label: "Earnings",           href: "/wallet",             color: "#D97706" },
    ] : []),
    { icon: Shield, label: "KYC Verification", href: "/kyc", color: "#6366F1" },
    { icon: CreditCard, label: "EMI Plans",         href: "/emi",         color: "#7C3AED" },
    { icon: ArrowUpRight, label: "Withdraw",        href: "/wallet/withdraw", color: "#D97706" },
    
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pb-24 pt-4">

        {/* Profile Card */}
        <div className="grad rounded-3xl p-5 mb-5 text-white shadow-xl shadow-purple-300/40">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user?.virtual_photo ? (
                <img src={user.virtual_photo} alt=""
                  className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <span className="text-3xl font-extrabold text-white">
                  {(user?.virtual_name || user?.full_name || "U")[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-extrabold text-xl leading-tight truncate">
                {user?.virtual_name || user?.full_name}
              </h2>
              <p className="text-white/70 text-xs truncate mt-0.5">
                {user?.email}
              </p>
              {user?.virtual_number && (
                <span className="inline-block font-mono text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded-full mt-1.5">
                  {user.virtual_number}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-4 flex-wrap">
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
              {role === "BUYER"        ? "🛒 Buyer"
               : role === "SHOPKEEPER"   ? "🏪 Shopkeeper"
               : role === "DELIVERY_BOY" ? "🚴 Delivery Boy"
               : "👑 Admin"}
            </span>
            {user?.is_verified && (
              <span className="bg-green-500/70 text-white text-xs font-bold px-3 py-1 rounded-full">
                ✓ Verified
              </span>
            )}
            {user?.village && (
              <span className="bg-white/15 text-white text-xs px-3 py-1 rounded-full">
                📍 {user.village}
              </span>
            )}
          </div>
        </div>

        {/* Menu */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <button key={i}
                onClick={() => router.push(item.href)}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 text-left">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: item.color + "15" }}>
                  <Icon size={18} style={{ color: item.color }} />
                </div>
                <span className="flex-1 font-semibold text-sm text-gray-900">
                  {item.label}
                </span>
                <ChevronRight size={15} className="text-gray-300" />
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 border border-red-200 text-red-500 font-bold rounded-xl text-sm hover:bg-red-100 transition-all">
          <LogOut size={16} />
          Logout
        </button>

        <p className="text-center text-xs text-gray-300 mt-5">
          QabiFly v1.0.0 · ZEAIPC · Reoti, Ballia UP
        </p>
      </div>
      <BotNav />
    </div>
  );
}
