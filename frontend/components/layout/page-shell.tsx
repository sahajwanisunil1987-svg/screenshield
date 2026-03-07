import { ReactNode } from "react";
import { Footer } from "./footer";
import { Navbar } from "./navbar";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-page-wash">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
