"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";

const schema = z.object({
  fullName: z.string().min(2),
  line1: z.string().min(5),
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
  const { items, clear } = useCartStore();
  const { token, user } = useAuthStore();
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: user?.email ?? "",
      paymentMethod: "COD"
    }
  });
  const paymentMethod = watch("paymentMethod");

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      toast.error("Please login before checkout");
      router.push("/login");
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
            city: values.city,
            state: values.state,
            postalCode: values.postalCode,
            country: "India",
            phone: values.phone,
            gstNumber: values.gstNumber
          },
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
              toast.success("Payment verified");
              router.push(`/order-success?orderNumber=${response.data.orderNumber}`);
            } catch (error) {
              toast.error(getApiErrorMessage(error, "Payment verification failed"));
            }
          }
        });

        razorpay.open();
        return;
      }

      clear();
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
            <Input placeholder="Full name" {...register("fullName")} />
            {errors.fullName ? <p className="text-sm text-red-500">{errors.fullName.message}</p> : null}
            <Input placeholder="Address line" {...register("line1")} />
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
                <label className="flex items-center gap-2 text-sm text-slate">
                  <input type="radio" value="COD" {...register("paymentMethod")} />
                  Cash on Delivery
                </label>
                <label className="flex items-center gap-2 text-sm text-slate">
                  <input type="radio" value="RAZORPAY" {...register("paymentMethod")} />
                  Razorpay
                </label>
              </div>
            </div>
            <Button disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Placing order..." : paymentMethod === "RAZORPAY" ? "Continue to Razorpay" : "Place order"}
            </Button>
          </form>
          <div className="rounded-[32px] bg-white p-8 shadow-card">
            <h2 className="text-xl font-semibold text-ink">Summary</h2>
            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between text-sm">
                  <span>{item.product.name} x {item.quantity}</span>
                  <span>{formatCurrency(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-slate-200 pt-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="mt-2 flex justify-between font-semibold text-ink">
                <span>Total</span>
                <span>{formatCurrency(subtotal > 999 ? subtotal : subtotal + 79)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
