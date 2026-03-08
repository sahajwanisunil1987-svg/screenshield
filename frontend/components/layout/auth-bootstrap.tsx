"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

export function AuthBootstrap() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setHydrated = useAuthStore((state) => state.setHydrated);

  useEffect(() => {
    if (hasHydrated) {
      return;
    }

    api
      .post("/auth/refresh")
      .then((response) => {
        if (response.status === 204 || !response.data?.token) {
          clearAuth();
          return;
        }

        setAuth(response.data.token, response.data.user);
      })
      .catch(() => {
        clearAuth();
      })
      .finally(() => {
        setHydrated(true);
      });
  }, [clearAuth, hasHydrated, setAuth, setHydrated]);

  return null;
}
