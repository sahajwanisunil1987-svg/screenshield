"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { calculateOrderPricing, defaultPricingSettings, PricingSettings } from "@/lib/order-pricing";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { CartSummary } from "@/components/cart/cart-summary";

export function CartPageClient() {
  const { items, updateQty, removeItem, couponCode, couponDiscount, applyCoupon, clearCoupon, hasHydrated } = useCartStore();
  const [couponInput, setCouponInput] = useState(couponCode);
  const [isApplying, setIsApplying] = useState(false);
  const [pricingSettings, setPricingSettings] = useState<PricingSettings>(defaultPricingSettings);
  const effectivePricingSettings = pricingSettings ?? defaultPricingSettings;
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const { shipping, tax, total } = calculateOrderPricing(subtotal, couponDiscount, effectivePricingSettings);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    void api
      .get("/settings/app")
      .then((response) => {
        setPricingSettings({
          shippingFee: Number(response.data.shippingFee ?? defaultPricingSettings.shippingFee),
          freeShippingThreshold: Number(response.data.freeShippingThreshold ?? defaultPricingSettings.freeShippingThreshold),
          codMaxOrderValue: Number(response.data.codMaxOrderValue ?? defaultPricingSettings.codMaxOrderValue),
          codDisabledPincodes: String(response.data.codDisabledPincodes ?? "")
        });
      })
      .catch(() => null);
  }, []);

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
              <CartLineItem
                key={`${item.product.id}:${item.variantId ?? "base"}`}
                item={item}
                onDecrease={() => updateQty(item.product.id, Math.max(item.quantity - 1, 1), item.variantId)}
                onIncrease={() =>
                  updateQty(
                    item.product.id,
                    Math.min(item.quantity + 1, item.availableStock),
                    item.variantId
                  )
                }
                onRemove={() => removeItem(item.product.id, item.variantId)}
              />
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
        <CartSummary
          hasHydrated={hasHydrated}
          hasItems={items.length > 0}
          subtotal={subtotal}
          shipping={shipping}
          freeShippingThreshold={effectivePricingSettings.freeShippingThreshold ?? defaultPricingSettings.freeShippingThreshold}
          tax={tax}
          total={total}
          couponCode={couponCode}
          couponDiscount={couponDiscount}
          couponInput={couponInput}
          isApplying={isApplying}
          onCouponInputChange={setCouponInput}
          onCouponApplied={applyCoupon}
          onCouponCleared={clearCoupon}
          setApplying={setIsApplying}
        />
      </div>
    </div>
  );
}
