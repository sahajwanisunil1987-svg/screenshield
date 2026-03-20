"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { calculateOrderPricing } from "@/lib/order-pricing";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { User } from "@/types";

const COD_MAX_ORDER_VALUE = 5000;
const BLOCKED_COD_PINCODES = ["560001", "110001"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const DEFAULT_FORM_VALUES: FormValues = {
  fullName: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  postalCode: "",
  phone: "",
  email: "",
  gstNumber: "",
  paymentMethod: "COD"
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clear, couponCode, couponDiscount, clearCoupon } = useCartStore();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [form, setForm] = useState<FormValues>({
    ...DEFAULT_FORM_VALUES,
    email: user?.email ?? ""
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const { shipping, tax, total } = calculateOrderPricing(subtotal, couponDiscount);
  const codAvailable = useMemo(
    () => total <= COD_MAX_ORDER_VALUE && !BLOCKED_COD_PINCODES.includes(form.postalCode.trim()),
    [form.postalCode, total]
  );

  useEffect(() => {
    if (!token) {
      router.replace("/login?next=/checkout");
      return;
    }

    api
      .get<User>("/auth/me", authHeaders(token))
      .then((response) => {
        const profile = response.data;
        if (!profile) {
          return;
        }

        setAuth(token, profile);
        const address = profile.addresses?.[0];

        setForm((current) => ({
          ...current,
          fullName: address?.fullName ?? profile.name ?? "",
          line1: address?.line1 ?? "",
          line2: address?.line2 ?? "",
          landmark: address?.landmark ?? "",
          city: address?.city ?? "",
          state: address?.state ?? "",
          postalCode: address?.postalCode ?? "",
          phone: address?.phone ?? profile.phone ?? "",
          email: profile.email ?? current.email,
          gstNumber: address?.gstNumber ?? "",
          paymentMethod: current.paymentMethod ?? "COD"
        }));
      })
      .catch(() => {});
  }, [router, setAuth, token]);

  useEffect(() => {
    if (!codAvailable && form.paymentMethod === "COD") {
      setForm((current) => ({ ...current, paymentMethod: "RAZORPAY" }));
    }
  }, [codAvailable, form.paymentMethod]);

  const updateField = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (form.fullName.trim().length < 2) nextErrors.fullName = "Enter full name";
    if (form.line1.trim().length < 5) nextErrors.line1 = "Enter address line";
    if (form.city.trim().length < 2) nextErrors.city = "Enter city";
    if (form.state.trim().length < 2) nextErrors.state = "Enter state";
    if (form.postalCode.trim().length < 5) nextErrors.postalCode = "Enter valid pincode";
    if (form.phone.trim().length < 10) nextErrors.phone = "Enter valid phone number";
    if (!EMAIL_REGEX.test(form.email.trim())) nextErrors.email = "Enter valid email";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      toast.error("Please login before checkout");
      router.push("/login");
      return;
    }

    if (!items.length) {
      toast.error("Your cart is empty");
      return;
    }

    if (!validate()) {
      return;
    }

    if (form.paymentMethod === "COD" && !codAvailable) {
      toast.error("Cash on Delivery is not available for this order. Please use Razorpay.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post(
        "/orders/create",
        {
          items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
          address: {
            fullName: form.fullName.trim(),
            line1: form.line1.trim(),
            line2: form.line2.trim() || undefined,
            landmark: form.landmark.trim() || undefined,
            city: form.city.trim(),
            state: form.state.trim(),
            postalCode: form.postalCode.trim(),
            country: "India",
            phone: form.phone.trim(),
            gstNumber: form.gstNumber.trim() || undefined,
            email: form.email.trim()
          },
          couponCode: couponCode || undefined,
          paymentMethod: form.paymentMethod
        },
        authHeaders(token)
      );

      if (form.paymentMethod === "RAZORPAY") {
        const paymentOrder = await api.post(
          "/payments/razorpay/create-order",
          { orderId: response.data.id },
          authHeaders(token)
        );

        if (!window.Razorpay) {
          toast.error("Razorpay SDK failed to load");
          return;
        }

        const razorpay = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          order_id: paymentOrder.data.id,
          amount: paymentOrder.data.amount,
          currency: paymentOrder.data.currency,
          name: "SpareKart",
          description: `Payment for order ${response.data.orderNumber}`,
          handler: async (paymentResponse: Record<string, string>) => {
            try {
              await api.post(
                "/payments/razorpay/verify",
                {
                  orderId: response.data.id,
                  razorpayOrderId: paymentResponse.razorpay_order_id,
                  razorpayPaymentId: paymentResponse.razorpay_payment_id,
                  razorpaySignature: paymentResponse.razorpay_signature
                },
                authHeaders(token)
              );
              clear();
              clearCoupon();
              toast.success("Payment verified. Order placed successfully.");
              router.push(`/order-success?orderNumber=${response.data.orderNumber}`);
            } catch (error) {
              toast.error(getApiErrorMessage(error, "Payment verification failed"));
            }
          },
          prefill: {
            name: form.fullName.trim(),
            email: form.email.trim(),
            contact: form.phone.trim()
          },
          theme: { color: "#0f766e" }
        });

        razorpay.open();
        return;
      }

      clear();
      clearCoupon();
      toast.success("Order placed successfully");
      router.push(`/order-success?orderNumber=${response.data.orderNumber}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to place order"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <PageShell>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl text-ink">Checkout</h1>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={onSubmit} className="space-y-4 rounded-[32px] bg-white p-8 shadow-card">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Delivery details</p>
              <p className="mt-2 text-sm text-slate">Use a complete serviceable address so dispatch and GST invoice details stay correct.</p>
            </div>
            <Input placeholder="Full name" value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} />
            {errors.fullName ? <p className="text-sm text-red-500">{errors.fullName}</p> : null}
            <Input placeholder="Address line" value={form.line1} onChange={(event) => updateField("line1", event.target.value)} />
            {errors.line1 ? <p className="text-sm text-red-500">{errors.line1}</p> : null}
            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Apartment / Shop / Floor (optional)" value={form.line2} onChange={(event) => updateField("line2", event.target.value)} />
              <Input placeholder="Landmark (optional)" value={form.landmark} onChange={(event) => updateField("landmark", event.target.value)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Input placeholder="City" value={form.city} onChange={(event) => updateField("city", event.target.value)} />
                {errors.city ? <p className="mt-2 text-sm text-red-500">{errors.city}</p> : null}
              </div>
              <div>
                <Input placeholder="State" value={form.state} onChange={(event) => updateField("state", event.target.value)} />
                {errors.state ? <p className="mt-2 text-sm text-red-500">{errors.state}</p> : null}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Input placeholder="Pincode" value={form.postalCode} onChange={(event) => updateField("postalCode", event.target.value)} />
                {errors.postalCode ? <p className="mt-2 text-sm text-red-500">{errors.postalCode}</p> : null}
              </div>
              <div>
                <Input placeholder="Phone number" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
                {errors.phone ? <p className="mt-2 text-sm text-red-500">{errors.phone}</p> : null}
              </div>
            </div>
            <Input placeholder="Email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
            {errors.email ? <p className="text-sm text-red-500">{errors.email}</p> : null}
            <Input placeholder="GST Number (optional)" value={form.gstNumber} onChange={(event) => updateField("gstNumber", event.target.value)} />
            <div className="rounded-[28px] bg-[#f5f8fb] p-4">
              <p className="text-sm font-semibold text-ink">Payment method</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${codAvailable ? "border-slate-200 bg-white text-slate" : "border-slate-100 bg-slate-50 text-slate/40"}`}>
                  <input
                    type="radio"
                    value="COD"
                    checked={form.paymentMethod === "COD"}
                    onChange={() => updateField("paymentMethod", "COD")}
                    disabled={!codAvailable}
                  />
                  Cash on Delivery
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate">
                  <input
                    type="radio"
                    value="RAZORPAY"
                    checked={form.paymentMethod === "RAZORPAY"}
                    onChange={() => updateField("paymentMethod", "RAZORPAY")}
                  />
                  Razorpay
                </label>
              </div>
              {!codAvailable ? <p className="mt-3 text-sm text-amber-700">COD unavailable for this order because the amount exceeds Rs. {COD_MAX_ORDER_VALUE} or the pincode is restricted.</p> : <p className="mt-3 text-sm text-slate">COD available for this order.</p>}
            </div>
            <Button disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Placing order..." : form.paymentMethod === "RAZORPAY" ? "Continue to Razorpay" : "Place order"}
            </Button>
          </form>
          <div className="rounded-[32px] bg-white p-8 shadow-card">
            <h2 className="text-xl font-semibold text-ink">Summary</h2>
            <p className="mt-2 text-sm text-slate">Your default saved address is auto-filled here and refreshed after each successful order.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#f5f8fb] p-4 text-sm text-slate"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Delivery</p><p className="mt-2 font-semibold text-ink">{shipping === 0 ? "Free shipping unlocked" : "Standard dispatch"}</p></div>
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
        </div>
      </div>
    </PageShell>
  );
}
