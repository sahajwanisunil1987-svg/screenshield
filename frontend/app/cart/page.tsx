"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { api, getApiErrorMessage } from "@/lib/api";
import { calculateOrderPricing } from "@/lib/order-pricing";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

export default function CartPage() {
  const { items, updateQty, removeItem, couponCode, couponDiscount, applyCoupon, clearCoupon } = useCartStore();
  const [couponInput, setCouponInput] = useState(couponCode);
  const [isApplying, setIsApplying] = useState(false);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const { shipping, tax, total } = calculateOrderPricing(subtotal, couponDiscount);

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl text-ink">Your cart</h1>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            {items.length ? (
              items.map((item) => (
                <div key={item.product.id} className="grid gap-4 rounded-[28px] bg-white p-5 shadow-card md:grid-cols-[110px_1fr_auto]">
                  <div className="relative h-28 overflow-hidden rounded-2xl bg-slate-100">
                    <Image src={item.product.images[0]?.url ?? "https://placehold.co/300x300"} alt={item.product.name} fill className="object-cover" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-ink">{item.product.name}</h2>
                    <p className="mt-2 text-sm text-slate">{item.product.model.name}</p>
                    <p className="mt-3 text-sm font-semibold text-ink">{formatCurrency(item.product.price)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <input
                      value={item.quantity}
                      onChange={(event) => updateQty(item.product.id, Number(event.target.value))}
                      type="number"
                      min={1}
                      className="w-20 rounded-xl border border-slate-200 px-3 py-2"
                    />
                    <button className="text-sm text-red-500" onClick={() => removeItem(item.product.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="Your cart is empty" description="Add spare parts from the catalog to start checkout." />
            )}
          </div>
          <div className="rounded-[32px] bg-white p-6 shadow-card">
            <h2 className="text-xl font-semibold text-ink">Order summary</h2>
            <div className="mt-6 space-y-3 text-sm text-slate">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : formatCurrency(shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              {couponDiscount > 0 ? (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon ({couponCode})</span>
                  <span>-{formatCurrency(couponDiscount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between font-semibold text-ink">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <input
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Coupon code"
              />
              <Button
                type="button"
                disabled={!couponInput.trim() || !items.length || isApplying}
                onClick={async () => {
                  setIsApplying(true);
                  try {
                    const response = await api.post("/coupons/validate", {
                      code: couponInput.trim(),
                      subtotal
                    });
                    applyCoupon({
                      code: couponInput.trim().toUpperCase(),
                      discount: Number(response.data.discount)
                    });
                    toast.success("Coupon applied");
                  } catch (error) {
                    clearCoupon();
                    toast.error(getApiErrorMessage(error, "Unable to apply coupon"));
                  } finally {
                    setIsApplying(false);
                  }
                }}
              >
                {isApplying ? "..." : "Apply"}
              </Button>
            </div>
            {couponCode ? (
              <button type="button" className="mt-3 text-sm text-slate underline" onClick={clearCoupon}>
                Remove coupon
              </button>
            ) : null}
            <Link href="/checkout" className="mt-4 block">
              <Button className="w-full">Proceed to Checkout</Button>
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
