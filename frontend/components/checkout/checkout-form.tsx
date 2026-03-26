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
      <Input placeholder="Full name" value={form.fullName} onChange={(event) => onFieldChange("fullName", event.target.value)} />
      {errors.fullName ? <p className="text-sm text-red-500">{errors.fullName}</p> : null}
      <Input placeholder="Address line" value={form.line1} onChange={(event) => onFieldChange("line1", event.target.value)} />
      {errors.line1 ? <p className="text-sm text-red-500">{errors.line1}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Input placeholder="Apartment / Shop / Floor (optional)" value={form.line2} onChange={(event) => onFieldChange("line2", event.target.value)} />
        <Input placeholder="Landmark (optional)" value={form.landmark} onChange={(event) => onFieldChange("landmark", event.target.value)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Input placeholder="City" value={form.city} onChange={(event) => onFieldChange("city", event.target.value)} />
          {errors.city ? <p className="mt-2 text-sm text-red-500">{errors.city}</p> : null}
        </div>
        <div>
          <Input placeholder="State" value={form.state} onChange={(event) => onFieldChange("state", event.target.value)} />
          {errors.state ? <p className="mt-2 text-sm text-red-500">{errors.state}</p> : null}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Input placeholder="Pincode" value={form.postalCode} onChange={(event) => onFieldChange("postalCode", event.target.value)} />
          {errors.postalCode ? <p className="mt-2 text-sm text-red-500">{errors.postalCode}</p> : null}
        </div>
        <div>
          <Input placeholder="Phone number" value={form.phone} onChange={(event) => onFieldChange("phone", event.target.value)} />
          {errors.phone ? <p className="mt-2 text-sm text-red-500">{errors.phone}</p> : null}
        </div>
      </div>
      <Input type="email" placeholder="Email" value={form.email} onChange={(event) => onFieldChange("email", event.target.value)} />
      {errors.email ? <p className="text-sm text-red-500">{errors.email}</p> : null}
      <Input placeholder="GST Number (optional)" value={form.gstNumber} onChange={(event) => onFieldChange("gstNumber", event.target.value)} />
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
      </div>
      <Button disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Placing order..." : form.paymentMethod === "RAZORPAY" ? "Continue to Razorpay" : "Place order"}
      </Button>
    </form>
  );
}
