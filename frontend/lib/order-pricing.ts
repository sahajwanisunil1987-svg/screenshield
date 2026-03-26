const GST_RATE = 0.18;
const SHIPPING_FEE = 79;
const FREE_SHIPPING_THRESHOLD = 999;

export type PricingSettings = {
  shippingFee?: number;
  freeShippingThreshold?: number;
  codMaxOrderValue?: number;
  codDisabledPincodes?: string;
};

export const defaultPricingSettings: Required<PricingSettings> = {
  shippingFee: SHIPPING_FEE,
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  codMaxOrderValue: 5000,
  codDisabledPincodes: ""
};

export const calculateOrderPricing = (subtotal: number, couponDiscount = 0, settings: PricingSettings = {}) => {
  const shippingFee = settings.shippingFee ?? SHIPPING_FEE;
  const freeShippingThreshold = settings.freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD;
  const shipping = subtotal <= 0 ? 0 : subtotal > freeShippingThreshold ? 0 : shippingFee;
  const tax = subtotal * GST_RATE;
  const total = Math.max(subtotal - couponDiscount, 0) + shipping + tax;

  return {
    shipping,
    tax,
    total
  };
};
