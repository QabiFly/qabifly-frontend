"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { Btn } from "@/components/ui/button";
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [role,  setRole]  = useState("BUYER");
  const [show,  setShow]  = useState(false);
  const [load,  setLoad]  = useState(false);

  const roles = [
    { v:"BUYER",        e:"🛒", l:"Buyer",        s:"Shopping/learning/medicine" },
    { v:"SHOPKEEPER",   e:"🏪", l:"Shopkeeper",   s:"Shops Agent" },
    { v:"DELIVERY_BOY", e:"🚴", l:"Delivery Boy", s:"Delivery Agent" },
  ];

  const handleRegister = async () => {
    if (!name || !email || !pass) {
      toast.error("All fields are required"); return;
    }
    if (pass.length < 8) {
      toast.error("Password must be 8+ characters"); return;
    }
    setLoad(true);
    try {
      await authApi.register({ email, password: pass, full_name: name, role });
      toast.success("Account created! Check your email for OTP.");
      router.push("/login");
    } catch (e: any) {
      const err = e.response?.data;
      const msg = typeof err === "object" && err !== null
        ? Object.values(err).flat().join(", ")
        : "Registration failed";
      toast.error(msg);
    } finally { setLoad(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <Link href="/login"
          className="inline-flex items-center gap-1 text-gray-400 text-sm mb-5 hover:text-gray-600">
          <ArrowLeft size={14} /> Login
        </Link>

        <div className="text-center mb-6">
          <div className="w-16 h-16 grad rounded-2xl inline-flex items-center justify-center shadow-xl shadow-purple-200 mb-3">
            <span className="text-3xl">🛒</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Create Account</h1>
          <p className="text-gray-400 text-sm">Join QabiFly family</p>
        </div>

        {/* Name */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-600 block mb-1">Full name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={15} />
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Arman Ansari"
              className="w-full bg-white rounded-xl pl-9 pr-4 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400 shadow-sm" />
          </div>
        </div>

        {/* Email */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-600 block mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={15} />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-white rounded-xl pl-9 pr-4 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400 shadow-sm" />
          </div>
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-600 block mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={15} />
            <input type={show ? "text" : "password"} value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="8+ characters"
              className="w-full bg-white rounded-xl pl-9 pr-10 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400 shadow-sm" />
            <button type="button" onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Role */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-gray-600 block mb-2">
            Select Account Type?
          </label>
          <div className="space-y-2">
            {roles.map((r) => (
              <button key={r.v} type="button" onClick={() => setRole(r.v)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  role === r.v
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}>
                <span className="text-xl">{r.e}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-900">{r.l}</p>
                  <p className="text-xs text-gray-400">{r.s}</p>
                </div>
                {role === r.v && (
                  <div className="w-5 h-5 grad rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <Btn onClick={handleRegister} loading={load} fullWidth className="mb-4 py-3.5">
          Create Account
        </Btn>

        <p className="text-center text-sm text-gray-500">
          Already have an accoun?{" "}
          <Link href="/login" className="text-purple-600 font-bold">Login</Link>
        </p>
      </div>
    </div>
  );
}
