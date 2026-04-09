import type { Metadata } from "next";
import { ContentPage } from "@/components/content/content-page";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: "Contact PurjiX for support, compatibility assistance, order help, and business inquiries."
});

const sections = [
  {
    title: "Customer support",
    body: [
      "Email us at Purjix@gmail.com or call +91 9351543131 for order tracking, product compatibility clarification, warranty queries, and checkout-related help.",
      "For faster support, include your order number and a short description of the issue."
    ]
  },
  {
    title: "Business and workshop inquiries",
    body: [
      "Repair-shop buyers and repeat workshop customers can contact us at Purjix@gmail.com or call +91 9351543131 for larger order coordination, catalog assistance, or stock-related discussions.",
      "For high-intent business inquiries, include the brands, models, and part categories you need."
    ]
  },
  {
    title: "Support hours",
    body: [
      "Support response times may vary based on order volume, operational hours, and whether the issue requires logistics or product verification.",
      "For urgent tracking questions, keep your order number ready before contacting the team on +91 9351543131."
    ]
  }
];

export default function ContactPage() {
  return (
    <ContentPage
      eyebrow="Contact"
      title="Talk to the PurjiX team"
      intro="Reach out at Purjix@gmail.com or call +91 9351543131 for pre-order fitment guidance, order support, returns discussion, or workshop-focused buying help."
      sections={sections}
    />
  );
}
