import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthBootstrap } from "@/components/layout/auth-bootstrap";
import { PwaRegister } from "@/components/pwa/pwa-register";

export const metadata: Metadata = {
  title: "SpareKart | Mobile Spare Parts Store",
  description: "Find premium mobile spare parts by brand, model, and part type.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SpareKart"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthBootstrap />
        <PwaRegister />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
