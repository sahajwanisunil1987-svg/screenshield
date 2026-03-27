"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormValues = {
  fullName: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
  gstNumber: string;
  paymentMethod: "COD" | "RAZORPAY";
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

type CheckoutFormProps = {
  form: FormValues;
  errors: FormErrors;
  isSubmitting: boolean;
  codAvailable: boolean;
  codMaxOrderValue: number;
  onFieldChange: <K extends keyof FormValues>(key: K, value: FormValues[K]) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
};

export function CheckoutForm({
  form,
  errors,
  isSubmitting,
  codAvailable,
  codMaxOrderValue,
  onFieldChange,
  onSubmit
}: CheckoutFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-[32px] bg-white p-8 shadow-card">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Delivery details</p>
        <p className="mt-2 text-sm text-slate">Use a complete serviceable address so dispatch and GST invoice details stay correct.</p>
      </div>
      <div>
        <label htmlFor="checkout-full-name" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate">
          Full name
        </label>
        <Input
          id="checkout-full-name"
          name="fullName"
          autoComplete="name"
          placeholder="Full name"
          value={form.fullName}
          onChange={(event) => onFieldChange("fullName", event.target.value)}
        />
        {errors.fullName ? <p className="mt-2 text-sm text-red-500">{errors.fullName}</p> : null}
      </div>
      <div>
        <label htmlFor="checkout-line1" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate">
          Address line 1
        </label>
        <Input
          id="checkout-line1"
          name="line1"
          autoComplete="address-line1"
          placeholder="House number, street, shop or office"
          value={form.line1}
          onChange={(event) => onFieldChange("line1", event.target.value)}
        />
        {errors.line1 ? <p className="mt-2 text-sm text-red-500">{errors.line1}</p> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="checkout-line2" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate">
            Address line 2
          </label>
          <Input
            id="checkout-line2"
            name="line2"
            autoComplete="address-line2"
            placeholder="Apartment / Shop / Floor (optional)"
            value={form.line2}
            onChange={(event) => onFieldChange("line2", event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="checkout-landmark" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate">
            Landmark
          </label>
          <Input
            id="checkout-landmark"
            name="landmark"
            placeholder="Landmark (optional)"
            value={form.landmark}
            onChange={(event) => onFieldChange("landmark", event.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="checkout-city" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate">
            City
          </label>
          <Input
            id="checkout-city"
            name="city"
            autoComplete="address-level2"
            placeholder="City"
            value={form.city}
            onChange={(event) => onFieldChange("city", event.target.value)}
          />
          {errors.city ? <p className="mt-2 text-sm text-red-500">{errors.city}</p> : null}
        </div>
        <div>
          <label htmlFor="checkout-state" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate">
            State
          </label>
          <Input
            id="checkout-state"
            name="state"
            autoComplete="address-level1"
            placeholder="State"
            value={form.state}
            onChange={(event) => onFieldChange("state", event.target.value)}
          />
          {errors.state ? <p className="mt-2 text-sm text-red-500">{errors.state}</p> : null}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="checkout-postal-code" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate">
            Pincode
          </label>
          <Input
            id="checkout-postal-code"
            name="postalCode"
            autoComplete="postal-code"
            inputMode="numeric"
            placeholder="Pincode"
            value={form.postalCode}
            onChange={(event) => onFieldChange("postalCode", event.target.value)}
          />
          {errors.postalCode ? <p className="mt-2 text-sm text-red-500">{errors.postalCode}</p> : null}
        </div>
        <div>
          <label htmlFor="checkout-phone" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate">
            Phone number
          </label>
          <Input
            id="checkout-phone"
            name="phone"
            autoComplete="tel"
            inputMode="tel"
            placeholder="Phone number"
            value={form.phone}
            onChange={(event) => onFieldChange("phone", event.target.value)}
          />
          {errors.phone ? <p className="mt-2 text-sm text-red-500">{errors.phone}</p> : null}
        </div>
      </div>
      <div>
        <label htmlFor="checkout-email" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate">
          Email
        </label>
        <Input
          id="checkout-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={form.email}
          onChange={(event) => onFieldChange("email", event.target.value)}
        />
        {errors.email ? <p className="mt-2 text-sm text-red-500">{errors.email}</p> : null}
      </div>
      <div>
        <label htmlFor="checkout-gst" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate">
          GST number
        </label>
        <Input
          id="checkout-gst"
          name="gstNumber"
          placeholder="GST Number (optional)"
          value={form.gstNumber}
          onChange={(event) => onFieldChange("gstNumber", event.target.value)}
        />
      </div>
      <div className="rounded-[28px] bg-[#f5f8fb] p-4">
        <p className="text-sm font-semibold text-ink">Payment method</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${codAvailable ? "border-slate-200 bg-white text-slate" : "border-slate-100 bg-slate-50 text-slate/40"}`}>
            <input
              type="radio"
              value="COD"
              checked={form.paymentMethod === "COD"}
              onChange={() => onFieldChange("paymentMethod", "COD")}
              disabled={!codAvailable}
            />
            Cash on Delivery
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate">
            <input
              type="radio"
              value="RAZORPAY"
              checked={form.paymentMethod === "RAZORPAY"}
              onChange={() => onFieldChange("paymentMethod", "RAZORPAY")}
            />
            Razorpay
          </label>
        </div>
        {!codAvailable ? (
          <p className="mt-3 text-sm text-amber-700">COD unavailable for this order because the amount exceeds Rs. {codMaxOrderValue} or the pincode is restricted.</p>
        ) : (
          <p className="mt-3 text-sm text-slate">COD available for this order.</p>
        )}
        <p className="mt-2 text-xs text-slate/70">
          Razorpay is best when you want instant confirmation. COD is available only for supported pincodes and eligible order values.
        </p>
      </div>
      <Button disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Placing order..." : form.paymentMethod === "RAZORPAY" ? "Continue to Razorpay" : "Place order"}
      </Button>
    </form>
  );
}
