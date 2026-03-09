import Link from "next/link";
import { CheckCircle2, PackageCheck, ReceiptText, Truck } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { OrderSuccessActions } from "./order-success-actions";

export default function OrderSuccessPage({
  searchParams
}: {
  searchParams: { orderNumber?: string };
}) {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="rounded-[40px] bg-white p-12 shadow-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-accent">Order placed</p>
          <h1 className="mt-4 font-display text-5xl text-ink">Thank you for shopping with SpareKart</h1>
          <p className="mt-5 text-sm text-slate">
            Your order number is <span className="font-semibold text-ink">{searchParams.orderNumber ?? "generated after checkout"}</span>.
          </p>
          <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
            <div className="rounded-[24px] bg-[#f5f8fb] p-5">
              <ReceiptText className="h-5 w-5 text-accent" />
              <p className="mt-3 text-sm font-semibold text-ink">Invoice ready</p>
              <p className="mt-1 text-sm text-slate">Your GST-compliant invoice will be available with the order.</p>
            </div>
            <div className="rounded-[24px] bg-[#f5f8fb] p-5">
              <PackageCheck className="h-5 w-5 text-accent" />
              <p className="mt-3 text-sm font-semibold text-ink">Order confirmed</p>
              <p className="mt-1 text-sm text-slate">We’ve captured your items and dispatch queue details.</p>
            </div>
            <div className="rounded-[24px] bg-[#f5f8fb] p-5">
              <Truck className="h-5 w-5 text-accent" />
              <p className="mt-3 text-sm font-semibold text-ink">Tracking next</p>
              <p className="mt-1 text-sm text-slate">Use your order number any time to check shipment progress.</p>
            </div>
          </div>
          <OrderSuccessActions orderNumber={searchParams.orderNumber} />
        </div>
      </div>
    </PageShell>
  );
}
