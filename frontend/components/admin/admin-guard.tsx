"use client";

import { ReactNode } from "react";
import { useAuthGuard } from "@/hooks/use-auth-guard";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, hasHydrated } = useAuthGuard("ADMIN");

  if (!hasHydrated || !user) {
    return null;
  }

  return <>{children}</>;
}
