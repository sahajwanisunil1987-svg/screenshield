import type { Metadata, Viewport } from "next";
import { ClientBootstraps } from "@/components/layout/client-bootstraps";
import { themeBootstrapScript } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "PurjiX | Mobile Spare Parts Store",
  description: "Find premium mobile spare parts by brand, model, and part type.",
  manifest: "/manifest.webmanifest",
  other: {
    "mobile-web-app-capable": "yes"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PurjiX"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#06101d" }
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        {children}
        <ClientBootstraps />
      </body>
    </html>
  );
}
