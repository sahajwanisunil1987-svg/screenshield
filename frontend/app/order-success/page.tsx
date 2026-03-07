import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export default function OrderSuccessPage({
  searchParams
}: {
  searchParams: { orderNumber?: string };
}) {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="rounded-[40px] bg-white p-12 shadow-card">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">Order placed</p>
          <h1 className="mt-4 font-display text-5xl text-ink">Thank you for shopping with SpareKart</h1>
          <p className="mt-5 text-sm text-slate">
            Your order number is <span className="font-semibold text-ink">{searchParams.orderNumber ?? "generated after checkout"}</span>.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/products">
              <Button>Continue shopping</Button>
            </Link>
            <Link href="/my-orders">
              <Button variant="secondary">View orders</Button>
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
