import type { Metadata } from "next";
import { ContentPage } from "@/components/content/content-page";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Support",
  description: "Get SpareKart support for order tracking, compatibility questions, warranty help, and post-purchase assistance."
});

const sections = [
  {
    title: "Order assistance",
    body: [
      "Use the SpareKart track-order flow to check the latest order status, shipping progression, and payment state.",
      "If an order looks delayed or needs clarification, contact support with the order number so the dispatch and payment details can be checked quickly."
    ]
  },
  {
    title: "Compatibility guidance",
    body: [
      "Mobile spare parts should be matched by brand, model, and part type before purchase. Where applicable, product pages also surface additional compatible models.",
      "If you are unsure whether a part fits your device or repair requirement, contact support before placing the order."
    ]
  },
  {
    title: "Warranty and after-sales help",
    body: [
      "Warranty coverage applies according to the product listing and SpareKart replacement policy. Physical damage, mishandling, and incorrect installation are typically excluded.",
      "For warranty-related help, keep your order details ready and describe the issue clearly so the support team can respond faster."
    ]
  }
];

export default function SupportPage() {
  return (
    <ContentPage
      eyebrow="Customer support"
      title="Support that fits the repair workflow"
      intro="SpareKart support is structured around faster order resolution, clearer compatibility guidance, and direct help for workshop and retail buyers."
      sections={sections}
    />
  );
}
