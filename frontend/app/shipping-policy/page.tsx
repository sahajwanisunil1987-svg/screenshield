import type { Metadata } from "next";
import { ContentPage } from "@/components/content/content-page";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Shipping Policy",
  description: "Read SpareKart shipping, dispatch, delivery, and tracking policy for mobile spare parts orders across India."
});

const sections = [
  {
    title: "Dispatch timeline",
    body: [
      "Most confirmed orders move into dispatch processing within 24 to 48 working hours, depending on stock verification, packaging checks, and order queue volume.",
      "Orders placed on Sundays, public holidays, or during exceptional courier disruptions may move on the next available working day."
    ]
  },
  {
    title: "Shipping charges",
    body: [
      "Orders above INR 999 generally qualify for free shipping. Smaller orders may include a standard dispatch charge that is shown clearly during checkout before payment.",
      "If any delivery surcharge, restricted-area handling, or serviceability exception applies, the final payable amount is shown before the order is placed."
    ]
  },
  {
    title: "Tracking and delivery",
    body: [
      "Once the order is packed or shipped, SpareKart may share courier name, AWB or tracking number, and estimated delivery timing through the order history and track order flow.",
      "Actual delivery speed can vary by city, courier route, weather, regional restrictions, and last-mile partner performance."
    ]
  },
  {
    title: "Address and serviceability",
    body: [
      "Customers should provide a complete and serviceable delivery address with correct phone number, pincode, and landmark details wherever possible.",
      "Incorrect address details, unreachable phone numbers, or restricted delivery pincodes can delay dispatch, re-attempts, or force payment-method restrictions such as COD unavailability."
    ]
  }
];

export default function ShippingPolicyPage() {
  return (
    <ContentPage
      eyebrow="Shipping policy"
      title="Dispatch, delivery, and tracking for replacement parts"
      intro="This page explains how SpareKart handles dispatch timing, shipping charges, delivery expectations, and order tracking for mobile spare parts orders across India."
      sections={sections}
    />
  );
}
