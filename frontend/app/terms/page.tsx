import type { Metadata } from "next";
import { ContentPage } from "@/components/content/content-page";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Terms and Conditions",
  description: "Read the SpareKart terms governing use of the storefront, orders, account access, and part compatibility responsibility."
});

const sections = [
  {
    title: "Use of the platform",
    body: [
      "By using SpareKart, customers agree to provide accurate account, shipping, and order information and to use the platform only for lawful purchasing activity.",
      "SpareKart may restrict, suspend, or cancel activity that appears fraudulent, abusive, or inconsistent with platform policy."
    ]
  },
  {
    title: "Product and compatibility responsibility",
    body: [
      "Customers should review brand, model, and part-type details before ordering. Where additional compatible models are listed, those should also be checked carefully.",
      "If there is uncertainty about fitment, support should be contacted before placing the order."
    ]
  },
  {
    title: "Pricing, orders, and liability",
    body: [
      "SpareKart may update pricing, stock, or availability without prior notice. Orders may be limited, cancelled, or adjusted when stock or verification issues arise.",
      "Liability is limited to the extent permitted by applicable law and subject to the order value, policy terms, and verified warranty scope."
    ]
  }
];

export default function TermsPage() {
  return (
    <ContentPage
      eyebrow="Terms"
      title="Terms and conditions"
      intro="These terms describe the basic rules for account usage, order handling, compatibility responsibility, and platform operation on SpareKart."
      sections={sections}
    />
  );
}
