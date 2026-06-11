"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useGoogleLogin } from "@react-oauth/google";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { fbAuth } from "@/lib/firebase";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Btn } from "@/components/ui/button";
import { Mail, Lock, Phone, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { User } from "@/types";

type Tab = "otp" | "pass" | "phone";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();

  const [tab,    setTab]    = useState<Tab>("otp");
  const [email,  setEmail]  = useState("");
  const [pass,   setPass]   = useState("");
  const [phone,  setPhone]  = useState("");
  const [otp,    setOtp]    = useState(["","","","","",""]);
  const [show,   setShow]   = useState(false);
  const [load,   setLoad]   = useState(false);
  const [sent,   setSent]   = useState(false);
  const [cfm,    setCfm]    = useState<ConfirmationResult | null>(null);

  const getRedir = (u: User) => {
    if (!u.onboarding_complete)       return "/onboarding";
    if (u.role === "SHOPKEEPER")      return "/shopkeeper/dashboard";
    if (u.role === "DELIVERY_BOY")    return "/delivery/dashboard";
    return "/";
  };

  const done = (d: any) => {
    const data = d.data || d;
    setTokens(data.access, data.refresh);
    setUser(data.user);
    toast.success(`Welcome! 👋`);
    router.push(getRedir(data.user));
  };

  const setDigit = (v: string, i: number) => {
    const a = [...otp];
    a[i] = v.replace(/\D/, "").slice(-1);
    setOtp(a);
    if (a[i] && i < 5) document.getElementById(`otp${i+1}`)?.focus();
    if (a.join("").length === 6) setTimeout(() => verify(a.join("")), 80);
  };

  const clearOtp = () => {
    setOtp(["","","","","",""]);
    document.getElementById("otp0")?.focus();
  };

  const sendEmailOTP = async () => {
    if (!email) { toast.error("Enter your email"); return; }
    setLoad(true);
    try {
      await authApi.sendOTP(email);
      setSent(true);
      toast.success("OTP Sent Successfully.");
      setTimeout(() => document.getElementById("otp0")?.focus(), 200);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to send OTP");
    } finally { setLoad(false); }
  };

  const verify = async (code = otp.join("")) => {
    if (code.length !== 6) { toast.error("6-digit OTP daalen"); return; }
    setLoad(true);
    try {
      if (tab === "otp") {
        const r = await authApi.verifyOTP(email, code);
        done(r.data);
      } else if (tab === "phone" && cfm) {
        const result  = await cfm.confirm(code);
        const idToken = await result.user.getIdToken();
        const r = await authApi.fbPhone(idToken);
        done(r.data);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Incorrect OTP");
      clearOtp();
    } finally { setLoad(false); }
  };

  const loginPass = async () => {
    if (!email || !pass) { toast.error("Email aur password daalen"); return; }
    setLoad(true);
    try {
      const r = await authApi.loginPass(email, pass);
      done(r.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Login failed");
    } finally { setLoad(false); }
  };

  const gLogin = useGoogleLogin({
    onSuccess: async (tr) => {
      setLoad(true);
      try {
        const r = await authApi.googleLogin(tr.access_token);
        done(r.data);
      } catch (e: any) {
        toast.error(e.response?.data?.message || "Google login failed");
      } finally { setLoad(false); }
    },
    onError: () => toast.error("Google login canceled."),
  });

  const sendPhoneOTP = async () => {
    if (!phone) { toast.error("Enter your Phone number"); return; }
    setLoad(true);
    try {
      if (!(window as any)._recap) {
        (window as any)._recap = new RecaptchaVerifier(
          fbAuth, "recap-box", { size: "invisible" }
        );
      }
      const num = phone.startsWith("+") ? phone : `+91${phone}`;
      const r   = await signInWithPhoneNumber(fbAuth, num, (window as any)._recap);
      setCfm(r);
      setSent(true);
      toast.success("OTP bheja gaya!");
      setTimeout(() => document.getElementById("otp0")?.focus(), 200);
    } catch (e: any) {
      toast.error("OTP send failed: " + e.message);
    } finally { setLoad(false); }
  };

  const mainAction = () => {
    if (tab === "pass")         return loginPass();
    if (sent)                   return verify();
    if (tab === "otp")          return sendEmailOTP();
    return sendPhoneOTP();
  };

  const mainLabel =
    tab === "pass" ? "Login" :
    sent           ? "Verify" :
    "OTP Bhejein";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <Link href="/"
          className="inline-flex items-center gap-1 text-gray-400 text-sm mb-5 hover:text-gray-600">
          <ArrowLeft size={14} /> Home
        </Link>

        {/* Logo */}
        <div className="text-center mb-7">
          <div className="w-16 h-16 grad rounded-2xl inline-flex items-center justify-center shadow-xl shadow-purple-200 mb-3">
            <span className="text-3xl">🛒</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Welcome back!</h1>
          <p className="text-gray-400 text-sm mt-1">Continue to QabiFly</p>
        </div>

        {/* Google Button */}
        <button
          onClick={() => gLogin()}
          disabled={load}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl py-3 shadow-sm hover:shadow-md transition-all mb-4 disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-gray-700 font-semibold text-sm">
            Continue with Google
          </span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-5 gap-1">
          {(["otp","pass","phone"] as Tab[]).map((t) => (
            <button key={t}
              onClick={() => { setTab(t); setSent(false); setOtp(["","","","","",""]); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === t ? "bg-white text-purple-600 shadow-sm" : "text-gray-500"
              }`}>
              {t === "otp" ? "📧 Email" : t === "pass" ? "🔑 Password" : "📱 Phone"}
            </button>
          ))}
        </div>

        {/* Email */}
        {(tab === "otp" || tab === "pass") && !sent && (
          <div className="mb-3">
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={15} />
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && mainAction()}
                placeholder="qabifly@zeaipc.in"
                className="w-full bg-white rounded-xl pl-9 pr-4 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 shadow-sm"
              />
            </div>
          </div>
        )}

        {/* Password */}
        {tab === "pass" && (
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={15} />
              <input
                type={show ? "text" : "password"} value={pass}
                onChange={(e) => setPass(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && mainAction()}
                placeholder="Password"
                className="w-full bg-white rounded-xl pl-9 pr-10 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 shadow-sm"
              />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="text-right mt-1.5">
              <Link href="/forgot-password"
                className="text-xs text-purple-500 font-semibold hover:text-purple-700">
               Forgot password?
              </Link>
            </div>
          </div>
        )}

        {/* Phone */}
        {tab === "phone" && !sent && (
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={15} />
              <input
                type="tel" value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full bg-white rounded-xl pl-9 pr-4 py-3 text-sm border border-gray-200 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 shadow-sm"
              />
            </div>
          </div>
        )}

        {/* OTP Boxes */}
        {sent && tab !== "pass" && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600">OTP Code</label>
              <span className="text-xs text-gray-400">{tab === "otp" ? email : phone}</span>
            </div>
            <div className="flex gap-2">
              {otp.map((d, i) => (
                <input
                  key={i} id={`otp${i}`} type="text" inputMode="numeric"
                  value={d} maxLength={1}
                  onChange={(e) => setDigit(e.target.value, i)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !d && i > 0)
                      document.getElementById(`otp${i-1}`)?.focus();
                  }}
                  className="flex-1 h-12 text-center text-xl font-extrabold border-2 border-gray-200 rounded-xl outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                />
              ))}
            </div>
            <button onClick={() => { setSent(false); clearOtp(); }}
              className="text-xs text-gray-400 hover:text-gray-600 w-full text-center mt-2 py-1">
              ← back
            </button>
          </div>
        )}

        <Btn onClick={mainAction} loading={load} fullWidth className="mb-4 py-3.5">
          {mainLabel}
        </Btn>

        <p className="text-center text-sm text-gray-500">
          New account?{" "}
          <Link href="/register" className="text-purple-600 font-bold hover:text-purple-700">
            Register
          </Link>
        </p>

        <p className="text-center mt-2">
          <Link href="/" className="text-xs text-blue-400 hover:text-gray-400">
            Continue as Guest →
          </Link>
        </p>

        <div id="recap-box" />
      </div>
    </div>
  );
}
