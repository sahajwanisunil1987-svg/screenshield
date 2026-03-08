const GST_RATE = 0.18;
const SHIPPING_FEE = 79;
const FREE_SHIPPING_THRESHOLD = 999;

export const calculateOrderPricing = (subtotal: number, couponDiscount = 0) => {
  const shipping = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const tax = subtotal * GST_RATE;
  const total = Math.max(subtotal - couponDiscount, 0) + shipping + tax;

  return {
    shipping,
    tax,
    total
  };
};
