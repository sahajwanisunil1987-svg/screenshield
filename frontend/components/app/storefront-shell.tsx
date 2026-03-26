import { ReactNode } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { WishlistSync } from "@/components/layout/wishlist-sync";

export function StorefrontShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-page-wash">
      <WishlistSync />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
