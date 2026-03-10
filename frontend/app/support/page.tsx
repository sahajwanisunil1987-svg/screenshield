import type { Metadata } from "next";
import { SupportPageClient } from "@/components/support/support-page-client";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Support",
  description: "Raise support requests for orders, returns, payments, and product inquiries on SpareKart."
});

export default function SupportPage() {
  return <SupportPageClient />;
}
