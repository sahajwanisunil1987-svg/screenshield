import { CartPageClient } from "@/components/cart/cart-page-client";
import { PageShell } from "@/components/layout/page-shell";

export default function CartPage() {
  return (
    <PageShell>
      <CartPageClient />
    </PageShell>
  );
}
