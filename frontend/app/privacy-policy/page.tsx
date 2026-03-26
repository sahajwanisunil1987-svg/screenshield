import type { Metadata } from "next";
import { ContentPage } from "@/components/content/content-page";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description: "Understand how PurjiX collects, uses, and protects customer information for ordering, support, and account access."
});

const sections = [
  {
    title: "Information collected",
    body: [
      "PurjiX collects the information required to create accounts, process orders, manage shipping, generate invoices, and provide customer support.",
      "This may include name, email, phone number, address details, order history, and payment-related references needed for operational processing."
    ]
  },
  {
    title: "How information is used",
    body: [
      "Customer data is used to authenticate accounts, process orders, communicate updates, provide after-sales support, and improve catalog and operational workflows.",
      "Payment credentials are handled through the configured payment provider rather than stored directly as card data by PurjiX."
    ]
  },
  {
    title: "Security and sharing",
    body: [
      "PurjiX uses reasonable technical controls to protect account and order data, but no online system should be treated as completely risk-free.",
      "Information is shared only where needed for operational execution, such as shipping, payment processing, notifications, or legal compliance."
    ]
  }
];

export default function PrivacyPolicyPage() {
  return (
    <ContentPage
      eyebrow="Privacy"
      title="Privacy policy"
      intro="This policy explains the basic ways PurjiX uses customer information to support login, checkout, order processing, and support workflows."
      sections={sections}
    />
  );
}
