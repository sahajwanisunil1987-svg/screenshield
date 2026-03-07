"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";

export function useAuthGuard(role?: "ADMIN" | "CUSTOMER") {
  const router = useRouter();
  const { user, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!user) {
      router.replace(role === "ADMIN" ? "/admin/login" : "/login");
      return;
    }

    if (role && user.role !== role) {
      router.replace("/");
    }
  }, [hasHydrated, router, role, user]);

  return { user, hasHydrated };
}
