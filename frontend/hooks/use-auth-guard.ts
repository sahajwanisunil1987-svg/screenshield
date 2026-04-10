"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { buildRedirectWithNext } from "@/lib/auth-redirect";
import { useAuthStore } from "@/store/auth-store";

export function useAuthGuard(role?: "ADMIN" | "CUSTOMER") {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!user) {
      const pathname = window.location.pathname;
      const search = window.location.search;
      router.replace(
        buildRedirectWithNext(role === "ADMIN" ? "/admin/login" : "/login", pathname, search)
      );
      return;
    }

    if (role && user.role !== role) {
      router.replace("/");
    }
  }, [hasHydrated, router, role, user]);

  return { user, hasHydrated };
}
