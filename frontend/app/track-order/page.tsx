import { PageShell } from "@/components/layout/page-shell";
import { TrackOrderPageClient } from "@/components/support/track-order-page-client";

export default function TrackOrderPage() {
  return (
    <PageShell>
      <TrackOrderPageClient />
    </PageShell>
  );
}
