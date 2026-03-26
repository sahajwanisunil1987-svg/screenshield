"use client";

import Link from "next/link";
import { ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

type CartSummaryProps = {
  hasHydrated: boolean;
  hasItems: boolean;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode: string;
  couponDiscount: number;
  couponInput: string;
  isApplying: boolean;
  onCouponInputChange: (value: string) => void;
  onCouponApplied: (payload: { code: string; discount: number }) => void;
  onCouponCleared: () => void;
  setApplying: (value: boolean) => void;
};

export function CartSummary({
  hasHydrated,
  hasItems,
  subtotal,
  shipping,
  tax,
  total,
  couponCode,
  couponDiscount,
  couponInput,
  isApplying,
  onCouponInputChange,
  onCouponApplied,
  onCouponCleared,
  setApplying
}: CartSummaryProps) {
  return (
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
            <p className="mt-1 text-slate">Orders above INR 999 qualify for free shipping. Lower-value orders include dispatch charges.</p>
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
          onChange={(event) => onCouponInputChange(event.target.value.toUpperCase())}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          placeholder="Coupon code"
        />
        <Button
          type="button"
          disabled={!hasHydrated || !couponInput.trim() || !hasItems || isApplying}
          onClick={async () => {
            setApplying(true);
            try {
              const response = await api.post("/coupons/validate", {
                code: couponInput.trim(),
                subtotal
              });
              onCouponApplied({
                code: couponInput.trim().toUpperCase(),
                discount: Number(response.data.discount)
              });
              toast.success("Coupon applied");
            } catch (error) {
              onCouponCleared();
              toast.error(getApiErrorMessage(error, "Unable to apply coupon"));
            } finally {
              setApplying(false);
            }
          }}
        >
          {isApplying ? "..." : "Apply"}
        </Button>
      </div>
      {couponCode ? (
        <button type="button" className="mt-3 text-sm text-slate underline" onClick={onCouponCleared}>
          Remove coupon
        </button>
      ) : null}
      <Link href="/checkout" className="mt-4 block">
        <Button className="w-full" disabled={!hasHydrated || !hasItems}>
          Proceed to Checkout
        </Button>
      </Link>
    </div>
  );
}
