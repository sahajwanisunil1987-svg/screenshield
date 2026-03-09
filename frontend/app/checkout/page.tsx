"use client";

import Script from "next/script";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { calculateOrderPricing } from "@/lib/order-pricing";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";

const COD_MAX_ORDER_VALUE = 5000;
const BLOCKED_COD_PINCODES = ["560001", "110001"];

const schema = z.object({
  fullName: z.string().min(2),
  line1: z.string().min(5),
  line2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(5),
  phone: z.string().min(10),
  email: z.string().email(),
  gstNumber: z.string().optional(),
  paymentMethod: z.enum(["COD", "RAZORPAY"])
});

type FormValues = z.infer<typeof schema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clear, couponCode, couponDiscount, clearCoupon } = useCartStore();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const { shipping, tax, total } = calculateOrderPricing(subtotal, couponDiscount);
  const { register, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: user?.email ?? "",
      paymentMethod: "COD"
    }
  });
  const paymentMethod = watch("paymentMethod");
  const postalCode = watch("postalCode");

  const codAvailable = useMemo(() => total <= COD_MAX_ORDER_VALUE && !BLOCKED_COD_PINCODES.includes((postalCode ?? "").trim()), [postalCode, total]);

  useEffect(() => {
    if (!token) {
      return;
    }

    api
      .get("/auth/me", authHeaders(token))
      .then((response) => {
        const profile = response.data;
        if (!profile) return;

        setAuth(token, profile);
        const address = profile.addresses?.[0];

        reset((current) => ({
          ...current,
          fullName: address?.fullName ?? profile.name ?? "",
          line1: address?.line1 ?? "",
          line2: address?.line2 ?? "",
          landmark: address?.landmark ?? "",
          city: address?.city ?? "",
          state: address?.state ?? "",
          postalCode: address?.postalCode ?? "",
          phone: address?.phone ?? profile.phone ?? "",
          email: profile.email ?? "",
          gstNumber: address?.gstNumber ?? "",
          paymentMethod: current.paymentMethod ?? "COD"
        }));
      })
      .catch(() => {});
  }, [reset, setAuth, token]);

  useEffect(() => {
    if (!codAvailable && paymentMethod === "COD") {
      setValue("paymentMethod", "RAZORPAY");
    }
  }, [codAvailable, paymentMethod, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      toast.error("Please login before checkout");
      router.push("/login");
      return;
    }

    if (!items.length) {
      toast.error("Your cart is empty");
      return;
    }

    if (values.paymentMethod === "COD" && !codAvailable) {
      toast.error("Cash on Delivery is not available for this order. Please use Razorpay.");
      return;
    }

    try {
      const response = await api.post(
        "/orders/create",
        {
          items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
          address: {
            fullName: values.fullName,
            line1: values.line1,
            line2: values.line2,
            landmark: values.landmark,
            city: values.city,
            state: values.state,
            postalCode: values.postalCode,
            country: "India",
            phone: values.phone,
            gstNumber: values.gstNumber,
            email: values.email
          },
          couponCode: couponCode || undefined,
          paymentMethod: values.paymentMethod
        },
        authHeaders(token)
      );

      if (values.paymentMethod === "RAZORPAY") {
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
            name: values.fullName,
            email: values.email,
            contact: values.phone
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
    }
  });

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
            <Input placeholder="Full name" {...register("fullName")} />
            {errors.fullName ? <p className="text-sm text-red-500">{errors.fullName.message}</p> : null}
            <Input placeholder="Address line" {...register("line1")} />
            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Apartment / Shop / Floor (optional)" {...register("line2")} />
              <Input placeholder="Landmark (optional)" {...register("landmark")} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="City" {...register("city")} />
              <Input placeholder="State" {...register("state")} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Pincode" {...register("postalCode")} />
              <Input placeholder="Phone number" {...register("phone")} />
            </div>
            <Input placeholder="Email" {...register("email")} />
            <Input placeholder="GST Number (optional)" {...register("gstNumber")} />
            <div className="rounded-[28px] bg-[#f5f8fb] p-4">
              <p className="text-sm font-semibold text-ink">Payment method</p>
              <div className="mt-3 flex gap-3">
                <label className={`flex items-center gap-2 text-sm ${codAvailable ? "text-slate" : "text-slate/40"}`}>
                  <input type="radio" value="COD" {...register("paymentMethod")} disabled={!codAvailable} />
                  Cash on Delivery
                </label>
                <label className="flex items-center gap-2 text-sm text-slate">
                  <input type="radio" value="RAZORPAY" {...register("paymentMethod")} />
                  Razorpay
                </label>
              </div>
              {!codAvailable ? <p className="mt-3 text-sm text-amber-700">COD unavailable for this order because the amount exceeds Rs. {COD_MAX_ORDER_VALUE} or the pincode is restricted.</p> : <p className="mt-3 text-sm text-slate">COD available for this order.</p>}
            </div>
            <Button disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Placing order..." : paymentMethod === "RAZORPAY" ? "Continue to Razorpay" : "Place order"}
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
