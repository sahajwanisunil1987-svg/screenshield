"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { calculateOrderPricing, defaultPricingSettings, PricingSettings } from "@/lib/order-pricing";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { User } from "@/types";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { CheckoutSummary } from "@/components/checkout/checkout-summary";

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

export function CheckoutPageClient() {
  const router = useRouter();
  const { items, clear, couponCode, couponDiscount, clearCoupon } = useCartStore();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [pricingSettings, setPricingSettings] = useState<PricingSettings>(defaultPricingSettings);
  const [form, setForm] = useState<FormValues>({
    ...DEFAULT_FORM_VALUES,
    email: user?.email ?? ""
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentInProgress, setIsPaymentInProgress] = useState(false);
  const effectivePricingSettings = pricingSettings ?? defaultPricingSettings;
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const taxLines = items.map((item) => ({
    lineTotal: item.unitPrice * item.quantity,
    gstRate: item.product.gstRate
  }));
  const { shipping, tax, total } = calculateOrderPricing(subtotal, couponDiscount, effectivePricingSettings, taxLines);
  const blockedCodPincodes = useMemo(
    () =>
      String(effectivePricingSettings.codDisabledPincodes ?? "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
    [effectivePricingSettings.codDisabledPincodes]
  );
  const codAvailable = useMemo(
    () =>
      total <= Number(effectivePricingSettings.codMaxOrderValue ?? defaultPricingSettings.codMaxOrderValue) &&
      !blockedCodPincodes.includes(form.postalCode.trim()),
    [blockedCodPincodes, effectivePricingSettings.codMaxOrderValue, form.postalCode, total]
  );

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

  const cancelUnpaidOrder = async (orderId: string) => {
    if (!token) return;

    try {
      const response = await api.post("/payments/razorpay/cancel", { orderId }, authHeaders(token));
      const retriesRemaining = Number(response.data?.retriesRemaining ?? 0);

      if (response.data?.cancelled) {
        toast.info("Payment window closed. Your unpaid order has been cancelled.");
        return;
      }

      toast.info(
        retriesRemaining > 0
          ? `Payment not completed. You can retry ${retriesRemaining} more time${retriesRemaining > 1 ? "s" : ""} from My Orders.`
          : "Payment not completed."
      );
    } catch {
      // Ignore cancellation issues here and let support/admin review the order manually.
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
          items: items.map((item) => ({
            productId: item.product.id,
            variantId: item.variantId,
            quantity: item.quantity
          })),
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
          name: "PurjiX",
          description: `Payment for order ${response.data.orderNumber}`,
          modal: {
            ondismiss: async () => {
              setIsPaymentInProgress(false);
              await cancelUnpaidOrder(response.data.id);
              router.push("/my-orders");
            }
          },
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
              setIsPaymentInProgress(false);
              toast.success("Payment verified. Order placed successfully.");
              router.push(`/order-success?orderNumber=${response.data.orderNumber}`);
            } catch (error) {
              setIsPaymentInProgress(false);
              toast.error(getApiErrorMessage(error, "Payment verification failed"));
              router.push("/my-orders");
            }
          },
          prefill: {
            name: form.fullName.trim(),
            email: form.email.trim(),
            contact: form.phone.trim()
          },
          theme: { color: "#0f766e" }
        });

        razorpay.on("payment.failed", async () => {
          setIsPaymentInProgress(false);
          await cancelUnpaidOrder(response.data.id);
          router.push("/my-orders");
        });

        setIsPaymentInProgress(true);
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
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl text-ink">Checkout</h1>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <CheckoutForm
            form={form}
            errors={errors}
            isSubmitting={isSubmitting || isPaymentInProgress}
            codAvailable={codAvailable}
            codMaxOrderValue={Number(effectivePricingSettings.codMaxOrderValue ?? defaultPricingSettings.codMaxOrderValue)}
            onFieldChange={updateField}
            onSubmit={onSubmit}
          />
          <CheckoutSummary
            items={items}
            subtotal={subtotal}
            couponCode={couponCode}
            couponDiscount={couponDiscount}
            shipping={shipping}
            freeShippingThreshold={Number(effectivePricingSettings.freeShippingThreshold ?? defaultPricingSettings.freeShippingThreshold)}
            tax={tax}
            total={total}
          />
        </div>
      </div>
    </>
  );
}
