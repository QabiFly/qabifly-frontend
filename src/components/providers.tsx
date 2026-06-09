"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "sonner";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api";
import Cookies from "js-cookie";

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry:                1,
      staleTime:            5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthBoot() {
  const { setUser, logout, setLoading } = useAuthStore();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const token = Cookies.get("qf_access");
    if (!token) { setLoading(false); return; }

    authApi.me()
      .then((r) => setUser(r.data.data))
      .catch(() => { logout(); setLoading(false); });
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <QueryClientProvider client={qc}>
        <AuthBoot />
        {children}
        <Toaster position="top-center" richColors closeButton duration={3000} />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}