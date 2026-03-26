import { ReactNode } from "react";
import { Footer } from "@/components/layout/footer";
import { MaintenanceGate } from "@/components/layout/maintenance-gate";
import { Navbar } from "@/components/layout/navbar";
import { WishlistSync } from "@/components/layout/wishlist-sync";

export function StorefrontShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-page-wash">
      <WishlistSync />
      <MaintenanceGate>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </MaintenanceGate>
    </div>
  );
}
