import type { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import "./globals.css";

const ClientBootstraps = dynamic(
  () => import("@/components/layout/client-bootstraps").then((module) => module.ClientBootstraps),
  { ssr: false }
);

const themeBootstrapScript = `(function(){try{var key="sparekart-site-theme";var savedTheme=window.localStorage.getItem(key);var theme=savedTheme==="dark"||savedTheme==="light"?savedTheme:"light";document.documentElement.dataset.theme=theme;document.body.dataset.theme=theme;document.documentElement.style.colorScheme=theme;}catch(e){}})();`;

export const metadata: Metadata = {
  title: "SpareKart | Mobile Spare Parts Store",
  description: "Find premium mobile spare parts by brand, model, and part type.",
  manifest: "/manifest.webmanifest",
  other: {
    "mobile-web-app-capable": "yes"
  },
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
