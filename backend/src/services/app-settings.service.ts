import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

export type CompanySettings = {
  companyName: string;
  legalName: string;
  gstin: string;
  supportPhone: string;
  supportEmail: string;
  addressLine1: string;
  addressLine2: string;
};

export type SiteSettings = {
  siteName: string;
  navbarSearchPlaceholder: string;
};

export type StorefrontSettings = {
  homeEyebrow: string;
  homeTitle: string;
  homeDescription: string;
  footerEyebrow: string;
  footerTitle: string;
  footerDescription: string;
};

export type PublicAppSettings = {
  company: CompanySettings;
  site: SiteSettings;
  storefront: StorefrontSettings;
};

const COMPANY_KEY = "company";
const SITE_KEY = "site";
const STOREFRONT_KEY = "storefront";

export const DEFAULT_APP_SETTINGS: PublicAppSettings = {
  company: {
    companyName: env.COMPANY_NAME,
    legalName: env.COMPANY_LEGAL_NAME,
    gstin: env.COMPANY_GSTIN,
    supportPhone: env.COMPANY_PHONE,
    supportEmail: env.COMPANY_EMAIL,
    addressLine1: env.COMPANY_ADDRESS_LINE1,
    addressLine2: env.COMPANY_ADDRESS_LINE2
  },
  site: {
    siteName: env.COMPANY_NAME,
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

const readSetting = async <T>(key: string, fallback: T): Promise<T> => {
  const setting = await prisma.appSetting.findUnique({
    where: { key },
    select: { value: true }
  });

  return {
    ...fallback,
    ...((setting?.value as Record<string, unknown> | null) ?? {})
  } as T;
};

export const getPublicAppSettings = async (): Promise<PublicAppSettings> => {
  const [company, site, storefront] = await Promise.all([
    readSetting<CompanySettings>(COMPANY_KEY, DEFAULT_APP_SETTINGS.company),
    readSetting<SiteSettings>(SITE_KEY, DEFAULT_APP_SETTINGS.site),
    readSetting<StorefrontSettings>(STOREFRONT_KEY, DEFAULT_APP_SETTINGS.storefront)
  ]);

  return { company, site, storefront };
};

export const updatePublicAppSettings = async (payload: Partial<PublicAppSettings>) => {
  const current = await getPublicAppSettings();
  const next = {
    company: { ...current.company, ...(payload.company ?? {}) },
    site: { ...current.site, ...(payload.site ?? {}) },
    storefront: { ...current.storefront, ...(payload.storefront ?? {}) }
  } satisfies PublicAppSettings;

  await Promise.all([
    prisma.appSetting.upsert({
      where: { key: COMPANY_KEY },
      update: { value: next.company },
      create: { key: COMPANY_KEY, value: next.company }
    }),
    prisma.appSetting.upsert({
      where: { key: SITE_KEY },
      update: { value: next.site },
      create: { key: SITE_KEY, value: next.site }
    }),
    prisma.appSetting.upsert({
      where: { key: STOREFRONT_KEY },
      update: { value: next.storefront },
      create: { key: STOREFRONT_KEY, value: next.storefront }
    })
  ]);

  return next;
};
