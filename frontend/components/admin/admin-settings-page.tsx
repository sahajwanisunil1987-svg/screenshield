"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Globe, Layers3, LifeBuoy, Save, ShieldCheck, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

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

const defaultSettings = {
  siteName: "PurjiX",
  legalName: "PurjiX Mobile Spare Parts",
  supportEmail: "support@purjix.com",
  supportPhone: "+91 99999 99999",
  supportWhatsapp: "+91 99999 99999",
  addressLine1: "Repair Market, Main Unit",
  addressLine2: "Mumbai, Maharashtra",
  heroHeading: "Mobile spare parts, faster sourcing, cleaner checkout.",
  heroSubheading: "Use admin settings to keep storefront branding and support details consistent.",
  announcementText: "Free shipping above Rs. 999",
  shippingFee: 79,
  freeShippingThreshold: 999,
  codMaxOrderValue: 5000,
  codDisabledPincodes: "",
  maintenanceMode: false,
  allowGuestCheckout: true,
  showSupportBanner: true
};

type SettingsState = typeof defaultSettings;

const environmentRows = (settings: SettingsState) => [
  { label: "Brand", value: settings.siteName || "PurjiX" },
  { label: "Frontend", value: "Next.js storefront/admin" },
  { label: "Backend API", value: process.env.NEXT_PUBLIC_API_BASE_URL ?? "Not configured" },
  { label: "Release mode", value: "GitHub + Vercel + Render" }
];

export function AdminSettingsPage() {
  const token = useAuthStore((state) => state.token);
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/admin/settings", authHeaders(token));
        if (!cancelled) {
          setSettings({ ...defaultSettings, ...response.data });
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(error, "Unable to load settings"));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const updateField = <K extends keyof SettingsState>(field: K, value: SettingsState[K]) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const saveSettings = async () => {
    if (!token) {
      toast.error("Admin session expired");
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.put("/admin/settings", settings, authHeaders(token));
      setSettings({ ...defaultSettings, ...response.data });
      toast.success("Settings saved");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save settings"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminShell title="Settings">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.16)] backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-white/10 p-3 text-teal-100">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Admin settings</p>
                  <h3 className="mt-2 font-display text-3xl text-white">Store configuration</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
                    Update core PurjiX branding, support details, and homepage messaging from one place. Changes now
                    persist through the admin API.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => void saveSettings()}
                disabled={isLoading || isSaving}
                className="gap-2 self-start whitespace-nowrap"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save settings"}
              </Button>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="space-y-4 rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/80">Branding</p>
                <Input
                  value={settings.siteName}
                  onChange={(event) => updateField("siteName", event.target.value)}
                  placeholder="Site name"
                  className="border-white/10 bg-white/10 text-white placeholder:text-white/35"
                  disabled={isLoading}
                />
                <Input
                  value={settings.legalName}
                  onChange={(event) => updateField("legalName", event.target.value)}
                  placeholder="Legal name"
                  className="border-white/10 bg-white/10 text-white placeholder:text-white/35"
                  disabled={isLoading}
                />
                <Input
                  value={settings.announcementText}
                  onChange={(event) => updateField("announcementText", event.target.value)}
                  placeholder="Announcement banner text"
                  className="border-white/10 bg-white/10 text-white placeholder:text-white/35"
                  disabled={isLoading}
                />
                <Input
                  type="number"
                  value={String(settings.freeShippingThreshold)}
                  onChange={(event) => updateField("freeShippingThreshold", Number(event.target.value || 0))}
                  placeholder="Free shipping threshold"
                  className="border-white/10 bg-white/10 text-white placeholder:text-white/35"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-4 rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/80">Support</p>
                <Input
                  value={settings.supportEmail}
                  onChange={(event) => updateField("supportEmail", event.target.value)}
                  placeholder="Support email"
                  className="border-white/10 bg-white/10 text-white placeholder:text-white/35"
                  disabled={isLoading}
                />
                <Input
                  value={settings.supportPhone}
                  onChange={(event) => updateField("supportPhone", event.target.value)}
                  placeholder="Support phone"
                  className="border-white/10 bg-white/10 text-white placeholder:text-white/35"
                  disabled={isLoading}
                />
                <Input
                  value={settings.supportWhatsapp}
                  onChange={(event) => updateField("supportWhatsapp", event.target.value)}
                  placeholder="WhatsApp number"
                  className="border-white/10 bg-white/10 text-white placeholder:text-white/35"
                  disabled={isLoading}
                />
                <Input
                  type="number"
                  value={String(settings.shippingFee)}
                  onChange={(event) => updateField("shippingFee", Number(event.target.value || 0))}
                  placeholder="Shipping fee"
                  className="border-white/10 bg-white/10 text-white placeholder:text-white/35"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="space-y-4 rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/80">Address</p>
                <Input
                  value={settings.addressLine1}
                  onChange={(event) => updateField("addressLine1", event.target.value)}
                  placeholder="Address line 1"
                  className="border-white/10 bg-white/10 text-white placeholder:text-white/35"
                  disabled={isLoading}
                />
                <Input
                  value={settings.addressLine2}
                  onChange={(event) => updateField("addressLine2", event.target.value)}
                  placeholder="Address line 2"
                  className="border-white/10 bg-white/10 text-white placeholder:text-white/35"
                  disabled={isLoading}
                />
                <Input
                  type="number"
                  value={String(settings.codMaxOrderValue)}
                  onChange={(event) => updateField("codMaxOrderValue", Number(event.target.value || 0))}
                  placeholder="COD max order value"
                  className="border-white/10 bg-white/10 text-white placeholder:text-white/35"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-4 rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/80">Homepage copy</p>
                <textarea
                  value={settings.heroHeading}
                  onChange={(event) => updateField("heroHeading", event.target.value)}
                  placeholder="Hero heading"
                  rows={3}
                  disabled={isLoading}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-teal-300 disabled:opacity-70"
                />
                <textarea
                  value={settings.heroSubheading}
                  onChange={(event) => updateField("heroSubheading", event.target.value)}
                  placeholder="Hero subheading"
                  rows={4}
                  disabled={isLoading}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-teal-300 disabled:opacity-70"
                />
                <Input
                  value={settings.codDisabledPincodes}
                  onChange={(event) => updateField("codDisabledPincodes", event.target.value)}
                  placeholder="Blocked COD pincodes (comma separated)"
                  className="border-white/10 bg-white/10 text-white placeholder:text-white/35"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/80">Feature toggles</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    key: "maintenanceMode" as const,
                    label: "Maintenance mode",
                    description: "Use when you want to pause storefront updates."
                  },
                  {
                    key: "allowGuestCheckout" as const,
                    label: "Guest checkout",
                    description: "Keep checkout open without forced login."
                  },
                  {
                    key: "showSupportBanner" as const,
                    label: "Support banner",
                    description: "Keep quick support visibility on the storefront."
                  }
                ].map((toggle) => (
                  <button
                    key={toggle.key}
                    type="button"
                    onClick={() => updateField(toggle.key, !settings[toggle.key])}
                    disabled={isLoading}
                    className={`rounded-[22px] border px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${
                      settings[toggle.key]
                        ? "border-teal-300/50 bg-teal-500/15 text-white"
                        : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                    }`}
                  >
                    <p className="text-sm font-semibold">{toggle.label}</p>
                    <p className="mt-2 text-xs leading-5 text-white/60">{toggle.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.16)] backdrop-blur">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white/10 p-3 text-teal-100">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Quick links</p>
                <h3 className="mt-2 font-display text-2xl text-white">Operational shortcuts</h3>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
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
        </section>

        <section className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.16)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Environment</p>
            <h3 className="mt-2 font-display text-2xl text-white">Current setup</h3>
            <div className="mt-6 space-y-4">
              {environmentRows(settings).map((row) => (
                <div key={row.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">{row.label}</p>
                  <p className="mt-2 break-all text-sm text-white/85">{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.16)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Settings snapshot</p>
            <h3 className="mt-2 font-display text-2xl text-white">Live preview</h3>
            <div className="mt-6 rounded-[24px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/80">{settings.siteName}</p>
              <h4 className="mt-3 text-2xl font-semibold text-white">{settings.heroHeading}</h4>
              <p className="mt-3 text-sm leading-6 text-white/70">{settings.heroSubheading}</p>
              <div className="mt-5 inline-flex rounded-full bg-teal-500/15 px-4 py-2 text-sm font-semibold text-teal-100">
                {settings.announcementText}
              </div>
              <div className="mt-6 space-y-2 text-sm text-white/70">
                <p>{settings.supportEmail}</p>
                <p>{settings.supportPhone}</p>
                <p>{settings.addressLine1}</p>
                <p>{settings.addressLine2}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
