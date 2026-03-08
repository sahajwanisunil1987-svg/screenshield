import { ReactNode } from "react";
import { Footer } from "./footer";
import { Navbar } from "./navbar";
import { WishlistSync } from "./wishlist-sync";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-page-wash">
      <WishlistSync />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
