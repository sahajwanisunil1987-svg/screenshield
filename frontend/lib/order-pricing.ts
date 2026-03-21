import type { ShippingSettings } from "@/types";
import { DEFAULT_SHIPPING_SETTINGS } from "@/lib/shipping-settings";

const GST_RATE = 0.18;

export const calculateOrderPricing = (
  subtotal: number,
  couponDiscount = 0,
  settings: ShippingSettings = DEFAULT_SHIPPING_SETTINGS
) => {
  const shipping = subtotal <= 0 ? 0 : subtotal > settings.freeShippingThreshold ? 0 : settings.shippingFee;
  const tax = subtotal * GST_RATE;
  const total = Math.max(subtotal - couponDiscount, 0) + shipping + tax;

  return {
    shipping,
    tax,
    total
  };
};
