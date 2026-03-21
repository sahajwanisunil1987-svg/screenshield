import type { Prisma } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

export type ShippingSettings = {
  shippingFee: number;
  freeShippingThreshold: number;
  codMaxOrderValue: number;
  blockedCodPincodes: string[];
};

const SHIPPING_SETTINGS_KEY = "shipping";

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  shippingFee: 79,
  freeShippingThreshold: 999,
  codMaxOrderValue: env.COD_MAX_ORDER_VALUE,
  blockedCodPincodes: (env.COD_DISABLED_PINCODES ?? "560001,110001")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
};

const sanitizeSettings = (value: Partial<ShippingSettings> | null | undefined): ShippingSettings => ({
  shippingFee: Number.isFinite(Number(value?.shippingFee)) ? Math.max(0, Number(value?.shippingFee)) : DEFAULT_SHIPPING_SETTINGS.shippingFee,
  freeShippingThreshold: Number.isFinite(Number(value?.freeShippingThreshold))
    ? Math.max(0, Number(value?.freeShippingThreshold))
    : DEFAULT_SHIPPING_SETTINGS.freeShippingThreshold,
  codMaxOrderValue: Number.isFinite(Number(value?.codMaxOrderValue))
    ? Math.max(0, Number(value?.codMaxOrderValue))
    : DEFAULT_SHIPPING_SETTINGS.codMaxOrderValue,
  blockedCodPincodes: Array.isArray(value?.blockedCodPincodes)
    ? value.blockedCodPincodes.map((entry) => String(entry).trim()).filter(Boolean)
    : DEFAULT_SHIPPING_SETTINGS.blockedCodPincodes
});

export const getShippingSettings = async (
  client: Pick<Prisma.TransactionClient | typeof prisma, "appSetting"> = prisma
): Promise<ShippingSettings> => {
  const setting = await client.appSetting.findUnique({
    where: { key: SHIPPING_SETTINGS_KEY },
    select: { value: true }
  });

  return sanitizeSettings((setting?.value as Partial<ShippingSettings> | null | undefined) ?? undefined);
};

export const updateShippingSettings = async (payload: Partial<ShippingSettings>): Promise<ShippingSettings> => {
  const nextValue = sanitizeSettings(payload);

  await prisma.appSetting.upsert({
    where: { key: SHIPPING_SETTINGS_KEY },
    update: { value: nextValue },
    create: {
      key: SHIPPING_SETTINGS_KEY,
      value: nextValue
    }
  });

  return nextValue;
};

export const calculateShippingAmount = (subtotal: number, settings: ShippingSettings) => {
  if (subtotal <= 0) return 0;
  return subtotal > settings.freeShippingThreshold ? 0 : settings.shippingFee;
};

export const isCodAllowedForShippingSettings = (postalCode: string | undefined, totalAmount: number, settings: ShippingSettings) => {
  if (totalAmount > settings.codMaxOrderValue) {
    return {
      allowed: false,
      reason: `Cash on Delivery is available only for orders up to Rs. ${settings.codMaxOrderValue}.`
    };
  }

  if (postalCode && settings.blockedCodPincodes.includes(postalCode.trim())) {
    return {
      allowed: false,
      reason: "Cash on Delivery is not available for this pincode."
    };
  }

  return { allowed: true };
};
