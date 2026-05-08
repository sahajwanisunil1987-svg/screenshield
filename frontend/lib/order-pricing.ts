const DEFAULT_GST_RATE = 18;
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

export type TaxLine = {
  lineTotal: number;
  gstRate?: number;
};

const calculateIncludedTax = (grossAmount: number, gstRate: number) => {
  if (grossAmount <= 0 || gstRate <= 0) return 0;
  return grossAmount - grossAmount / (1 + gstRate / 100);
};

export const calculateOrderPricing = (
  subtotal: number,
  couponDiscount = 0,
  settings: PricingSettings = {},
  taxLines: TaxLine[] = [{ lineTotal: subtotal, gstRate: DEFAULT_GST_RATE }]
) => {
  const shippingFee = settings.shippingFee ?? SHIPPING_FEE;
  const freeShippingThreshold = settings.freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD;
  const shipping = subtotal <= 0 ? 0 : subtotal > freeShippingThreshold ? 0 : shippingFee;
  const discountableSubtotal = taxLines.reduce((sum, item) => sum + item.lineTotal, 0);
  const tax = taxLines.reduce((sum, item) => {
    const allocatedDiscount = discountableSubtotal > 0 ? (item.lineTotal / discountableSubtotal) * couponDiscount : 0;
    const discountedLineTotal = Math.max(item.lineTotal - allocatedDiscount, 0);
    return sum + calculateIncludedTax(discountedLineTotal, item.gstRate ?? DEFAULT_GST_RATE);
  }, 0);
  const total = Math.max(subtotal - couponDiscount, 0) + shipping;

  return {
    shipping,
    tax,
    total
  };
};
