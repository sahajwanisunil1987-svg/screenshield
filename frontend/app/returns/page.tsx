import type { Metadata } from "next";
import { ContentPage } from "@/components/content/content-page";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Returns and Refunds",
  description: "Read SpareKart return, refund, replacement, and damaged-delivery policy for mobile spare parts orders."
});

const sections = [
  {
    title: "Return eligibility",
    body: [
      "Returns or replacements are typically considered only for eligible parts that arrive damaged, defective, or clearly mismatched against the confirmed order details.",
      "Parts that have been installed, tampered with, physically damaged, or used in a way that prevents inspection may not qualify for return or replacement."
    ]
  },
  {
    title: "Reporting window",
    body: [
      "Any issue should be reported as soon as possible after delivery, ideally with order number, product images, packaging images, and a clear explanation of the problem.",
      "Faster reporting improves claim handling, especially for transit damage or compatibility disputes."
    ]
  },
  {
    title: "Refund and replacement handling",
    body: [
      "Where a return is approved, SpareKart may offer a replacement, store resolution, or refund depending on stock availability and issue type.",
      "Refund timelines can vary based on the original payment method and banking partner processing."
    ]
  }
];

export default function ReturnsPage() {
  return (
    <ContentPage
      eyebrow="Returns policy"
      title="Returns and refunds for replacement parts"
      intro="Because spare parts are fitment-sensitive, return approval depends on condition, timing, and whether the reported issue can be verified against the order."
      sections={sections}
    />
  );
}
