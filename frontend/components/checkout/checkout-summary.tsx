"use client";

import { CartItem } from "@/store/cart-store";
import { formatCurrency } from "@/lib/utils";

type CheckoutSummaryProps = {
  items: CartItem[];
  subtotal: number;
  couponCode: string;
  couponDiscount: number;
  shipping: number;
  freeShippingThreshold: number;
  tax: number;
  total: number;
};

export function CheckoutSummary({
  items,
  subtotal,
  couponCode,
  couponDiscount,
  shipping,
  freeShippingThreshold,
  tax,
  total
}: CheckoutSummaryProps) {
  return (
    <div className="rounded-[32px] bg-white p-8 shadow-card">
      <h2 className="text-xl font-semibold text-ink">Summary</h2>
      <p className="mt-2 text-sm text-slate">Your default saved address is auto-filled here and refreshed after each successful order.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#f5f8fb] p-4 text-sm text-slate"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Delivery</p><p className="mt-2 font-semibold text-ink">{shipping === 0 ? `Free shipping above INR ${freeShippingThreshold}` : "Standard dispatch"}</p></div>
        <div className="rounded-2xl bg-[#f5f8fb] p-4 text-sm text-slate"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Invoice</p><p className="mt-2 font-semibold text-ink">GST-ready order invoice</p></div>
        <div className="rounded-2xl bg-[#f5f8fb] p-4 text-sm text-slate"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Support</p><p className="mt-2 font-semibold text-ink">Warranty-backed assistance</p></div>
      </div>
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item.product.id} className="flex items-center justify-between text-sm">
            <span>{item.product.name} x {item.quantity}</span>
            <span>{formatCurrency(item.product.price * item.quantity)}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 border-t border-slate-200 pt-4 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
        {couponDiscount > 0 ? <div className="mt-2 flex justify-between text-emerald-600"><span>Coupon ({couponCode})</span><span>-{formatCurrency(couponDiscount)}</span></div> : null}
        <div className="mt-2 flex justify-between"><span>Shipping</span><span>{shipping === 0 ? "Free" : formatCurrency(shipping)}</span></div>
        <div className="mt-2 flex justify-between"><span>GST</span><span>{formatCurrency(tax)}</span></div>
        <div className="mt-4 flex justify-between font-semibold text-ink"><span>Total</span><span>{formatCurrency(total)}</span></div>
      </div>
    </div>
  );
}
