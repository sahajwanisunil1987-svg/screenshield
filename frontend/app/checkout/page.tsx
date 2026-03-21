import { PageShell } from "@/components/layout/page-shell";
import { CheckoutPageClient } from "@/components/checkout/checkout-page-client";

export default function CheckoutPage() {
  return (
    <PageShell>
      <CheckoutPageClient />
    </PageShell>
  );
}
