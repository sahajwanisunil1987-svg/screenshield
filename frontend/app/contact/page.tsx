import type { Metadata } from "next";
import { ContentPage } from "@/components/content/content-page";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: "Contact SpareKart for support, compatibility assistance, order help, and business inquiries."
});

const sections = [
  {
    title: "Customer support",
    body: [
      "Use the support email or phone line for order tracking, product compatibility clarification, warranty queries, and checkout-related help.",
      "For fastest handling, include your order number and a short description of the issue."
    ]
  },
  {
    title: "Business and workshop inquiries",
    body: [
      "Repair-shop buyers and repeat workshop customers can reach out for larger order coordination, catalog assistance, or stock-related discussion.",
      "SpareKart is built around workshop-ready parts discovery, so high-intent business inquiries should include the models and categories in demand."
    ]
  },
  {
    title: "Support hours",
    body: [
      "Support response times may vary based on order volume, operational hours, and whether the issue requires logistics or product verification.",
      "For urgent tracking questions, keep your order number ready before contacting the team."
    ]
  }
];

export default function ContactPage() {
  return (
    <ContentPage
      eyebrow="Contact"
      title="Talk to the SpareKart team"
      intro="Reach out for pre-order fitment guidance, order support, returns discussion, or workshop-focused buying help."
      sections={sections}
    />
  );
}
