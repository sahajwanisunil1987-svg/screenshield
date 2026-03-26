import { ReactNode } from "react";
import { StorefrontShell } from "@/components/app/storefront-shell";

export function PageShell({ children }: { children: ReactNode }) {
  return <StorefrontShell>{children}</StorefrontShell>;
}
