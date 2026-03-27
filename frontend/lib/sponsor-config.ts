import { SponsorAd, SponsorPlacement } from "@/types";

const sponsorEntries: SponsorAd[] = [
  {
    name: "Toolkit Pro Supplies",
    title: "Need repair tools, tapes, and bench essentials too?",
    subtitle:
      "Partner stock for repair shops looking to bundle spare parts with daily-use tools and consumables.",
    targetUrl: "https://wa.me/919999999999?text=Hi%2C%20I%20want%20details%20for%20repair%20tools%20and%20bench%20supplies.",
    ctaLabel: "Ask on WhatsApp",
    placement: "home_primary",
    badge: "Sponsored",
    isActive: true,
    priority: 10
  },
  {
    name: "Repair Academy Partner",
    title: "Training, tools, and verified repair support",
    subtitle: "A trusted ecosystem partner for technicians and workshop owners who want faster turnaround.",
    targetUrl: "https://wa.me/919999999999?text=Hi%2C%20I%20want%20details%20about%20training%20and%20repair%20support.",
    ctaLabel: "Learn more",
    placement: "footer_partner",
    badge: "Partner",
    isActive: true,
    priority: 10
  }
];

export function getSponsorByPlacement(placement: SponsorPlacement) {
  return sponsorEntries.find((entry) => entry.placement === placement && entry.isActive) ?? null;
}
