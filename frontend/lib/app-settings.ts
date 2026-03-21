import type { PublicAppSettings } from "@/types";

export const DEFAULT_APP_SETTINGS: PublicAppSettings = {
  company: {
    companyName: "SpareKart",
    legalName: "SpareKart Electronics",
    gstin: "27ABCDE1234F1Z5",
    supportPhone: "+91 99999 99999",
    supportEmail: "support@sparekart.in",
    addressLine1: "Repair Market, Unit 12",
    addressLine2: "Mumbai, Maharashtra 400001"
  },
  site: {
    siteName: "SpareKart",
    navbarSearchPlaceholder: "Search by brand, model, part, or SKU"
  },
  storefront: {
    homeEyebrow: "Mobile spare parts made easy",
    homeTitle: "Find the right spare part in three quick steps.",
    homeDescription: "Choose the brand, pick the model, then open batteries, displays, charging parts, cameras, and more.",
    footerEyebrow: "SpareKart support",
    footerTitle: "Verified spare parts, simpler discovery, faster replacement flow.",
    footerDescription: "SpareKart helps retail buyers and repair shops find the right part faster with compatibility-first browsing, secure checkout, and India-ready dispatch."
  }
};
