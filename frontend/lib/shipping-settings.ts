import type { ShippingSettings } from "@/types";

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  shippingFee: 79,
  freeShippingThreshold: 999,
  codMaxOrderValue: 5000,
  blockedCodPincodes: ["560001", "110001"]
};
