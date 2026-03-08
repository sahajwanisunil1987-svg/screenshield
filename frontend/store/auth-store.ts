"use client";

import { create } from "zustand";
import { User } from "@/types";

type AuthStore = {
  token: string | null;
  user: User | null;
  hasHydrated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  setHydrated: (value: boolean) => void;
};

export const useAuthStore = create<AuthStore>()((set) => ({
  token: null,
  user: null,
  hasHydrated: false,
  setAuth: (token, user) => set({ token, user, hasHydrated: true }),
  clearAuth: () => set({ token: null, user: null, hasHydrated: true }),
  setHydrated: (value) => set({ hasHydrated: value })
}));
