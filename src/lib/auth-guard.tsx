"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api";

export function useGuard(requiredRole?: string) {
  const router = useRouter();
  const { user, isAuth, setUser, logout } = useAuthStore();
  const [ready, setReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("qf_access");
    
    if (!token) {
      router.replace("/login");
      setIsLoading(false);
      return;
    }

    if (user && isAuth) {
      if (requiredRole && user.role !== requiredRole) {
        router.replace("/");
        return;
      }
      setReady(true);
      setIsLoading(false);
      return;
    }

    // Token hai lekin user nahi — fetch karo
    authApi.me()
      .then((r) => {
        const u = r.data.data || r.data;
        setUser(u);
        if (requiredRole && u.role !== requiredRole) {
          router.replace("/");
          return;
        }
        setReady(true);
        setIsLoading(false);
      })
      .catch(() => {
        logout();
        router.replace("/login");
        setIsLoading(false);
      });
  }, []);

  return { user, ready, isLoading };
}
