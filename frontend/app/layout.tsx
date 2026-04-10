import type { Metadata, Viewport } from "next";
import { ClientBootstraps } from "@/components/layout/client-bootstraps";
import { buildOrganizationStructuredData, buildWebsiteStructuredData, defaultOgImage, isProductionSite, siteName, siteUrl } from "@/lib/seo";
import { themeBootstrapScript } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | Mobile Spare Parts Store`,
    template: `%s | ${siteName}`
  },
  description: "Find premium mobile spare parts by brand, model, and part type.",
  applicationName: siteName,
  alternates: {
    canonical: "/"
  },
  keywords: ["mobile spare parts", "phone parts", "display combo", "battery replacement", "charging port", "PurjiX"],
  category: "shopping",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: `${siteName} | Mobile Spare Parts Store`,
    description: "Find premium mobile spare parts by brand, model, and part type.",
    type: "website",
    url: siteUrl,
    siteName,
    images: [
      {
        url: defaultOgImage,
        width: 512,
        height: 512,
        alt: `${siteName} mobile spare parts store`
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | Mobile Spare Parts Store`,
    description: "Find premium mobile spare parts by brand, model, and part type.",
    images: [defaultOgImage]
  },
  robots: {
    index: isProductionSite,
    follow: isProductionSite
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  },
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
  const organizationStructuredData = buildOrganizationStructuredData();
  const websiteStructuredData = buildWebsiteStructuredData();

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="font-sans" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
        />
        {children}
        <ClientBootstraps />
      </body>
    </html>
  );
}
