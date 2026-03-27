"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const shopLinks = [
  { href: "/brands", label: "Brands" },
  { href: "/categories", label: "Categories" },
  { href: "/products", label: "Products" },
  { href: "/compare", label: "Compare" }
];

const accountLinks = [
  { href: "/track-order", label: "Track Order" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
  { href: "/my-orders", label: "My Orders" }
];

const supportLinks = [
  { href: "/support", label: "Support" },
  { href: "/contact", label: "Contact Us" },
  { href: "/returns", label: "Returns" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" }
];

type FooterSettings = {
  siteName?: string;
  supportEmail?: string;
  supportPhone?: string;
  supportHours?: string;
  addressLine1?: string;
  addressLine2?: string;
};

const footerFallbackSettings: Required<FooterSettings> = {
  siteName: "PurjiX",
  supportEmail: "support@purjix.com",
  supportPhone: "+91 99999 99999",
  supportHours: "Mon-Sat, 10 AM to 7 PM",
  addressLine1: "Repair Market, Main Unit",
  addressLine2: "Mumbai, Maharashtra"
};

export function Footer() {
  const [settings, setSettings] = useState(footerFallbackSettings);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await api.get("/settings/app");
        if (!cancelled) {
          setSettings({ ...footerFallbackSettings, ...response.data });
        }
      } catch {
        if (!cancelled) {
          setSettings(footerFallbackSettings);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer className="mt-12 border-t border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_26%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_18%),linear-gradient(180deg,#07111f,#0b1b30)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/80">PurjiX support</p>
              <p className="mt-1.5 text-sm leading-6 text-white/70 sm:text-[15px]">
                Verified spare parts, compatibility-first discovery, secure checkout, and fast dispatch across India.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/products" className="rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-ink transition hover:bg-white/90">
                Browse catalog
              </Link>
              <Link href="/track-order" className="rounded-full border border-white/15 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                Track an order
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 lg:grid-cols-[1.05fr_0.7fr_0.7fr_1fr]">
            <div>
              <h3 className="font-display text-[1.55rem]">PurjiX</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/70">
                Premium mobile spare parts with verified quality, secure payments, and workshop-friendly support across India.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/65">
                <span className="rounded-full border border-white/10 px-2.5 py-1">Warranty-backed</span>
                <span className="rounded-full border border-white/10 px-2.5 py-1">Secure checkout</span>
                <span className="rounded-full border border-white/10 px-2.5 py-1">Fast dispatch</span>
              </div>
            </div>

            <FooterLinkGroup title="Shop" links={shopLinks} />
            <FooterLinkGroup title="Account" links={accountLinks} />

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Support</p>
              <div className="mt-2.5 space-y-2 text-sm text-white/80">
                {supportLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="block transition hover:text-white">
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="mt-3 space-y-1.5 text-sm text-white/65">
                <p className="font-semibold text-white">{settings.siteName} Support Desk</p>
                <p>{settings.addressLine1}</p>
                <p>{settings.addressLine2}</p>
                <p className="pt-1">
                  Email:{" "}
                  <a href={`mailto:${settings.supportEmail}`} className="text-white/85 transition hover:text-white">
                    {settings.supportEmail}
                  </a>
                </p>
                <p>
                  Phone:{" "}
                  <a href={`tel:${settings.supportPhone.replace(/\s+/g, "")}`} className="text-white/85 transition hover:text-white">
                    {settings.supportPhone}
                  </a>
                </p>
                <p>Hours: {settings.supportHours}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2.5 border-t border-white/10 pt-4 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 PurjiX. Mobile spare parts for repair shops and retail buyers.</p>
            <div className="flex flex-wrap gap-4 text-white/60">
              <Link href="/privacy-policy" className="transition hover:text-white">Privacy</Link>
              <Link href="/terms" className="transition hover:text-white">Terms</Link>
              <Link href="/returns" className="transition hover:text-white">Returns</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLinkGroup({
  title,
  links
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">{title}</p>
      <div className="mt-2.5 space-y-2 text-sm text-white/80">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="block transition hover:text-white">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
