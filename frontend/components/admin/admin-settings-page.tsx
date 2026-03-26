"use client";

import Link from "next/link";
import { Globe, Layers3, LifeBuoy, ShieldCheck, ShoppingBag } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";

const appCards = [
  {
    title: "Storefront",
    description: "Review customer-facing routes and check branding, navigation, and product discovery flows.",
    href: "/",
    action: "Open storefront",
    icon: Globe
  },
  {
    title: "Catalog setup",
    description: "Manage brands, models, and categories from the existing admin tools.",
    href: "/admin/brands",
    action: "Manage catalog",
    icon: Layers3
  },
  {
    title: "Operations",
    description: "Handle orders, inventory, and purchase workflows from the core admin modules.",
    href: "/admin/orders",
    action: "Open operations",
    icon: ShoppingBag
  },
  {
    title: "Support",
    description: "Track support inbox activity and help customers from the admin panel.",
    href: "/admin/support",
    action: "Open support",
    icon: LifeBuoy
  }
];

const environmentRows = [
  { label: "Brand", value: "PurjiX" },
  { label: "Frontend", value: "Next.js storefront/admin" },
  { label: "Backend API", value: process.env.NEXT_PUBLIC_API_BASE_URL ?? "Not configured" },
  { label: "Release mode", value: "GitHub + Vercel + Render" }
];

export function AdminSettingsPage() {
  return (
    <AdminShell title="Settings">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.16)] backdrop-blur">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white/10 p-3 text-teal-100">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Admin settings</p>
              <h3 className="mt-2 font-display text-3xl text-white">Operations control center</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
                This page acts as the admin settings hub. Use it to quickly jump into catalog, storefront, support,
                and operational areas while keeping the PurjiX setup consistent.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {appCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="rounded-2xl bg-white/10 p-3 text-white/90 transition group-hover:bg-white group-hover:text-ink">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/80">Open</span>
                  </div>
                  <h4 className="mt-5 text-lg font-semibold text-white">{card.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-white/65">{card.description}</p>
                  <div className="mt-5 text-sm font-semibold text-teal-200">{card.action}</div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.16)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Environment</p>
            <h3 className="mt-2 font-display text-2xl text-white">Current setup</h3>
            <div className="mt-6 space-y-4">
              {environmentRows.map((row) => (
                <div key={row.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">{row.label}</p>
                  <p className="mt-2 break-all text-sm text-white/85">{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.16)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Recommended next steps</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-white/70">
              <li>Use this page as the stable entry point for operational settings in admin.</li>
              <li>For branding and release checks, verify public pages after each deploy.</li>
              <li>Keep backend API base URL aligned with the deployed `/api` endpoint.</li>
            </ul>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
