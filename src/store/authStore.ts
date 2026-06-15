"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";
import { User } from "@/types";

interface AuthStore {
  user:       User | null;
  isAuth:     boolean;
  isLoading:  boolean;
  setUser:    (u: User) => void;
  setTokens:  (access: string, refresh: string) => void;
  logout:     () => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user:       null,
      isAuth:     false,
      isLoading:  true,

      setUser: (user) =>
        set({ user, isAuth: true, isLoading: false }),

      setTokens: (access, refresh) => {
        Cookies.set("qf_access",  access,  { expires: 1, secure: true, sameSite: "lax" });
        Cookies.set("qf_refresh", refresh, { expires: 7, secure: true, sameSite: "lax" });
      },

      logout: () => {
        Cookies.remove("qf_access");
        Cookies.remove("qf_refresh");
        set({ user: null, isAuth: false });
      },

      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name:       "qabifly-auth",
      partialize: (s) => ({ user: s.user, isAuth: s.isAuth }),
    }
  )
);