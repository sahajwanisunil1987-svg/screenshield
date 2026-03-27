import type { Metadata, Viewport } from "next";
import { ClientBootstraps } from "@/components/layout/client-bootstraps";
import { themeBootstrapScript } from "@/lib/theme";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "PurjiX | Mobile Spare Parts Store",
  description: "Find premium mobile spare parts by brand, model, and part type.",
  alternates: {
    canonical: "/"
  },
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
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="font-sans" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        {children}
        <ClientBootstraps />
      </body>
    </html>
  );
}
