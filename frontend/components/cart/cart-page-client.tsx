"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { api, getApiErrorMessage } from "@/lib/api";
import { calculateOrderPricing } from "@/lib/order-pricing";
import { useShippingSettings } from "@/hooks/use-shipping-settings";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

export function CartPageClient() {
  const { items, updateQty, removeItem, couponCode, couponDiscount, applyCoupon, clearCoupon, hasHydrated } = useCartStore();
  const [couponInput, setCouponInput] = useState(couponCode);
  const [isApplying, setIsApplying] = useState(false);
  const shippingSettings = useShippingSettings();
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const { shipping, tax, total } = calculateOrderPricing(subtotal, couponDiscount, shippingSettings);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl text-ink">Your cart</h1>
      <div className="theme-surface mt-6 grid gap-4 rounded-[32px] border border-slate-200/80 p-5 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Checkout readiness</p>
          <p className="mt-3 text-sm text-slate">
            Review quantities, coupon savings, GST, and dispatch details before moving into address and payment confirmation.
          </p>
        </div>
        <div className="theme-surface rounded-[24px] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Items in cart</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{hasHydrated ? totalItems : "..."}</p>
          <p className="mt-1 text-sm text-slate">{hasHydrated ? `${items.length} product line(s)` : "Loading cart"}</p>
        </div>
        <div className="theme-surface rounded-[24px] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Current total</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{hasHydrated ? (items.length ? formatCurrency(total) : formatCurrency(0)) : "..."}</p>
          <p className="mt-1 text-sm text-slate">{hasHydrated && items.length ? "Includes shipping and GST" : "Add items to see shipping and GST"}</p>
        </div>
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {!hasHydrated ? (
            Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="theme-surface grid gap-4 rounded-[28px] p-5 md:grid-cols-[110px_1fr_auto]">
                <div className="h-28 rounded-2xl bg-slate-100" />
                <div className="space-y-3">
                  <div className="h-5 w-2/3 rounded-full bg-slate-100" />
                  <div className="h-4 w-1/3 rounded-full bg-slate-100" />
                  <div className="h-4 w-1/4 rounded-full bg-slate-100" />
                </div>
                <div className="space-y-3">
                  <div className="h-10 w-20 rounded-xl bg-slate-100" />
                  <div className="h-4 w-16 rounded-full bg-slate-100" />
                </div>
              </div>
            ))
          ) : items.length ? (
            items.map((item) => (
              <div key={item.product.id} className="theme-surface grid gap-4 rounded-[28px] p-5 sm:grid-cols-[110px_1fr] xl:grid-cols-[110px_1fr_auto]">
                <div className="relative h-28 overflow-hidden rounded-2xl bg-slate-100">
                  <Image src={item.product.images[0]?.url ?? "https://placehold.co/300x300"} alt={item.product.name} fill className="object-cover" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-ink">{item.product.name}</h2>
                  <p className="mt-2 text-sm text-slate">{item.product.model.name}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
                    <span className="rounded-full bg-accentSoft px-3 py-1 text-accent">{item.product.category.name}</span>
                    <span className="rounded-full bg-panel px-3 py-1 text-slate">SKU {item.product.sku}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-ink">{formatCurrency(item.product.price)}</p>
                  {(item.product.inventory?.stock ?? item.product.stock) <= 3 ? (
                    <p className="mt-2 text-sm font-semibold text-[#b45309]">
                      Only {item.product.inventory?.stock ?? item.product.stock} unit(s) left in stock
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-row flex-wrap items-center justify-between gap-3 sm:col-span-2 xl:col-span-1 xl:flex-col xl:items-end">
                  <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-panel px-3 py-2">
                    <button
                      type="button"
                      onClick={() => updateQty(item.product.id, Math.max(item.quantity - 1, 1))}
                      className="rounded-full border border-slate-200 bg-white p-2 text-slate transition hover:bg-accentSoft"
                      aria-label={`Decrease quantity for ${item.product.name}`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-6 text-center text-sm font-semibold text-ink">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQty(
                          item.product.id,
                          Math.min(item.quantity + 1, item.product.inventory?.stock ?? item.product.stock)
                        )
                      }
                      className="rounded-full border border-slate-200 bg-white p-2 text-slate transition hover:bg-accentSoft"
                      aria-label={`Increase quantity for ${item.product.name}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-ink">{formatCurrency(item.product.price * item.quantity)}</p>
                  <button className="text-sm text-red-500" onClick={() => removeItem(item.product.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-4">
              <EmptyState title="Your cart is empty" description="Add spare parts from the catalog to start checkout." />
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/products">
                  <Button>Browse products</Button>
                </Link>
                <Link href="/brands">
                  <Button variant="secondary">Shop by brand</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
        <div className="theme-surface rounded-[32px] p-6">
          <h2 className="text-xl font-semibold text-ink">Order summary</h2>
          <div className="mt-5 grid gap-3 rounded-[24px] bg-panel p-4 text-sm text-slate">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-accent" />
              <div>
                <p className="font-semibold text-ink">GST-ready invoice</p>
                <p className="mt-1 text-slate">Invoice details will stay aligned with your checkout address and order summary.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Truck className="mt-0.5 h-4 w-4 text-accent" />
              <div>
                <p className="font-semibold text-ink">Dispatch guidance</p>
                <p className="mt-1 text-slate">{`Orders above INR ${shippingSettings.freeShippingThreshold} qualify for free shipping. Lower-value orders include dispatch charges of ${formatCurrency(shippingSettings.shippingFee)}.`}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-sm text-slate">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{hasHydrated ? formatCurrency(subtotal) : "..."}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{hasHydrated ? (shipping === 0 ? "Free" : formatCurrency(shipping)) : "..."}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (18%)</span>
              <span>{hasHydrated ? formatCurrency(tax) : "..."}</span>
            </div>
            {couponDiscount > 0 ? (
              <div className="flex justify-between text-emerald-600">
                <span>Coupon ({couponCode})</span>
                <span>{hasHydrated ? `-${formatCurrency(couponDiscount)}` : "..."}</span>
              </div>
            ) : null}
            <div className="flex justify-between font-semibold text-ink">
              <span>Total</span>
              <span>{hasHydrated ? formatCurrency(total) : "..."}</span>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={couponInput}
              onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Coupon code"
            />
            <Button
              type="button"
              disabled={!hasHydrated || !couponInput.trim() || !items.length || isApplying}
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
            <Button className="w-full" disabled={!hasHydrated || !items.length}>Proceed to Checkout</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
