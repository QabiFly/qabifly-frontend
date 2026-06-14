// src/hooks/useAuth.ts
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function useRequireAuth(role?: string) {
  const router  = useRouter();
  const { user, isAuth, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuth) {
      router.push("/login");
      return;
    }
    if (role && user?.role !== role) {
      router.push("/");
    }
  }, [isAuth, isLoading, user, role]);

  return { user, isAuth, isLoading };
}
