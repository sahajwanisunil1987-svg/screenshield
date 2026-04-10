import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const APP_SETTINGS_ID = "default";

export const appSettingsDefaults = {
  id: APP_SETTINGS_ID,
  siteName: "PurjiX",
  legalName: "PurjiX Mobile Spare Parts",
  supportEmail: "support@purjix.com",
  supportPhone: "+91 99999 99999",
  supportWhatsapp: "+91 99999 99999",
  supportHours: "Mon-Sat, 10 AM to 7 PM",
  addressLine1: "Repair Market, Main Unit",
  addressLine2: "Mumbai, Maharashtra",
  heroHeading: "Mobile spare parts, faster sourcing, cleaner checkout.",
  heroSubheading: "Use admin settings to keep storefront branding and support details consistent.",
  announcementText: "Free shipping above Rs. 999",
  supportBannerText: "WhatsApp support available for urgent part checks and bulk buying.",
  maintenanceMessage: "We are updating the storefront and will be back shortly.",
  showDeveloperCredit: false,
  developerName: "",
  developerUrl: "",
  orderPrefix: "PJX",
  invoicePrefix: "INV",
  invoiceGstin: "27ABCDE1234F1Z5",
  invoiceSupportEmail: "support@purjix.com",
  invoiceSupportPhone: "+91 99999 99999",
  invoiceSupplyLabel: "Domestic taxable supply",
  invoiceAuthorizedSignatory: "Authorised Signatory",
  invoiceFooterNote: "This is a computer-generated GST invoice.",
  invoiceDeclaration: "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.",
  shippingFee: new Prisma.Decimal(79),
  freeShippingThreshold: new Prisma.Decimal(999),
  codMaxOrderValue: new Prisma.Decimal(5000),
  codDisabledPincodes: "",
  returnWindowDays: 7,
  maintenanceMode: false,
  allowGuestCheckout: true,
  showSupportBanner: true
};

type AppSettingClient = Pick<typeof prisma, "appSetting">;

export const ensureAppSettings = async (client: AppSettingClient = prisma) =>
  client.appSetting.upsert({
    where: { id: APP_SETTINGS_ID },
    update: {},
    create: appSettingsDefaults
  });

export const serializeAppSettings = async (client: AppSettingClient = prisma) => {
  const settings = await ensureAppSettings(client);

  return {
    ...settings,
    shippingFee: Number(settings.shippingFee),
    freeShippingThreshold: Number(settings.freeShippingThreshold),
    codMaxOrderValue: Number(settings.codMaxOrderValue)
  };
};
