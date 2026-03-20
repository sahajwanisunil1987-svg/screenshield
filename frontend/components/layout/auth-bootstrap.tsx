"use client";

import { useEffect } from "react";
import { refreshAccessToken } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

export function AuthBootstrap() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const setHydrated = useAuthStore((state) => state.setHydrated);

  useEffect(() => {
    if (hasHydrated) {
      return;
    }

    refreshAccessToken()
      .finally(() => {
        setHydrated(true);
      });
  }, [hasHydrated, setHydrated]);

  return null;
}
