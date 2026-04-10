"use client";

import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Globe,
  Layers3,
  LifeBuoy,
  MessageSquare,
  RotateCcw,
  Save,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Truck
} from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

const appCards = [
  {
    title: "Storefront",
    description: "Check live branding, homepage messaging, search, and customer-facing flows.",
    href: "/",
    action: "Open storefront",
    icon: Globe
  },
  {
    title: "Catalog setup",
    description: "Manage brands, models, and categories when settings need catalog support.",
    href: "/admin/brands",
    action: "Manage catalog",
    icon: Layers3
  },
  {
    title: "Operations",
    description: "Go straight into orders, inventory, and purchase workflows from here.",
    href: "/admin/orders",
    action: "Open operations",
    icon: ShoppingBag
  },
  {
    title: "Support",
    description: "Handle support tickets and keep buyer communication aligned with storefront settings.",
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
  supportHours: "Mon-Sat, 10 AM to 7 PM",
  addressLine1: "Repair Market, Main Unit",
  addressLine2: "Mumbai, Maharashtra",
  heroHeading: "Mobile spare parts, faster sourcing, cleaner checkout.",
  heroSubheading: "Use admin settings to keep storefront branding and support details consistent.",
  announcementText: "Free shipping above Rs. 999",
  supportBannerText: "WhatsApp support available for urgent part checks and bulk buying.",
  maintenanceMessage: "We are updating the storefront and will be back shortly.",
  showDeveloperCredit: false,
  developerName: "",
  developerUrl: "",
  orderPrefix: "PJX",
  invoicePrefix: "INV",
  invoiceGstin: "27ABCDE1234F1Z5",
  invoiceSupportEmail: "support@purjix.com",
  invoiceSupportPhone: "+91 99999 99999",
  invoiceSupplyLabel: "Domestic taxable supply",
  invoiceAuthorizedSignatory: "Authorised Signatory",
  invoiceFooterNote: "This is a computer-generated GST invoice.",
  invoiceDeclaration: "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.",
  shippingFee: 79,
  freeShippingThreshold: 999,
  codMaxOrderValue: 5000,
  codDisabledPincodes: "",
  returnWindowDays: 7,
  maintenanceMode: false,
  allowGuestCheckout: true,
  showSupportBanner: true
};

type SettingsState = typeof defaultSettings;

const toSafeString = (value: unknown, fallback: string) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }

  return fallback;
};

const toSafeNumber = (value: unknown, fallback: number) => {
  const nextValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(nextValue) ? nextValue : fallback;
};

const toSafeBoolean = (value: unknown, fallback: boolean) => (typeof value === "boolean" ? value : fallback);

const normalizeSettings = (value: Partial<Record<keyof SettingsState, unknown>> | undefined | null): SettingsState => ({
  siteName: toSafeString(value?.siteName, defaultSettings.siteName),
  legalName: toSafeString(value?.legalName, defaultSettings.legalName),
  supportEmail: toSafeString(value?.supportEmail, defaultSettings.supportEmail),
  supportPhone: toSafeString(value?.supportPhone, defaultSettings.supportPhone),
  supportWhatsapp: toSafeString(value?.supportWhatsapp, defaultSettings.supportWhatsapp),
  supportHours: toSafeString(value?.supportHours, defaultSettings.supportHours),
  addressLine1: toSafeString(value?.addressLine1, defaultSettings.addressLine1),
  addressLine2: toSafeString(value?.addressLine2, defaultSettings.addressLine2),
  heroHeading: toSafeString(value?.heroHeading, defaultSettings.heroHeading),
  heroSubheading: toSafeString(value?.heroSubheading, defaultSettings.heroSubheading),
  announcementText: toSafeString(value?.announcementText, defaultSettings.announcementText),
  supportBannerText: toSafeString(value?.supportBannerText, defaultSettings.supportBannerText),
  maintenanceMessage: toSafeString(value?.maintenanceMessage, defaultSettings.maintenanceMessage),
  showDeveloperCredit: toSafeBoolean(value?.showDeveloperCredit, defaultSettings.showDeveloperCredit),
  developerName: typeof value?.developerName === "string" ? value.developerName.trim() : defaultSettings.developerName,
  developerUrl: typeof value?.developerUrl === "string" ? value.developerUrl.trim() : defaultSettings.developerUrl,
  orderPrefix: toSafeString(value?.orderPrefix, defaultSettings.orderPrefix).toUpperCase().replace(/\s+/g, ""),
  invoicePrefix: toSafeString(value?.invoicePrefix, defaultSettings.invoicePrefix).toUpperCase().replace(/\s+/g, ""),
  invoiceGstin: toSafeString(value?.invoiceGstin, defaultSettings.invoiceGstin).toUpperCase().replace(/\s+/g, ""),
  invoiceSupportEmail: toSafeString(value?.invoiceSupportEmail, defaultSettings.invoiceSupportEmail),
  invoiceSupportPhone: toSafeString(value?.invoiceSupportPhone, defaultSettings.invoiceSupportPhone),
  invoiceSupplyLabel: toSafeString(value?.invoiceSupplyLabel, defaultSettings.invoiceSupplyLabel),
  invoiceAuthorizedSignatory: toSafeString(value?.invoiceAuthorizedSignatory, defaultSettings.invoiceAuthorizedSignatory),
  invoiceFooterNote: toSafeString(value?.invoiceFooterNote, defaultSettings.invoiceFooterNote),
  invoiceDeclaration: toSafeString(value?.invoiceDeclaration, defaultSettings.invoiceDeclaration),
  shippingFee: toSafeNumber(value?.shippingFee, defaultSettings.shippingFee),
  freeShippingThreshold: toSafeNumber(value?.freeShippingThreshold, defaultSettings.freeShippingThreshold),
  codMaxOrderValue: toSafeNumber(value?.codMaxOrderValue, defaultSettings.codMaxOrderValue),
  codDisabledPincodes: typeof value?.codDisabledPincodes === "string" ? value.codDisabledPincodes : defaultSettings.codDisabledPincodes,
  returnWindowDays: Math.max(0, Math.min(30, Math.round(toSafeNumber(value?.returnWindowDays, defaultSettings.returnWindowDays)))),
  maintenanceMode: toSafeBoolean(value?.maintenanceMode, defaultSettings.maintenanceMode),
  allowGuestCheckout: toSafeBoolean(value?.allowGuestCheckout, defaultSettings.allowGuestCheckout),
  showSupportBanner: toSafeBoolean(value?.showSupportBanner, defaultSettings.showSupportBanner)
});

const environmentRows = (settings: SettingsState) => [
  { label: "Brand", value: settings.siteName || "PurjiX" },
  { label: "Order prefix", value: settings.orderPrefix || "PJX" },
  { label: "Frontend", value: "Next.js storefront/admin" },
  { label: "Backend API", value: process.env.NEXT_PUBLIC_API_BASE_URL ?? "Not configured" },
  { label: "Release mode", value: "GitHub + Render" }
];

export function AdminSettingsPage() {
  const token = useAuthStore((state) => state.token);
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [savedSettings, setSavedSettings] = useState<SettingsState>(defaultSettings);
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
          const nextSettings = normalizeSettings(response.data);
          setSettings(nextSettings);
          setSavedSettings(nextSettings);
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

  const isDirty = useMemo(() => JSON.stringify(settings) !== JSON.stringify(savedSettings), [savedSettings, settings]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  const resetToSaved = () => {
    setSettings(savedSettings);
    toast.success("Reverted unsaved changes");
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    toast.success("Loaded default settings locally");
  };

  const saveSettings = async () => {
    if (!token) {
      toast.error("Admin session expired");
      return;
    }

    if (settings.maintenanceMode !== savedSettings.maintenanceMode) {
      const confirmed = window.confirm(
        settings.maintenanceMode
          ? "Turn ON maintenance mode? Public storefront users will see the maintenance screen."
          : "Turn OFF maintenance mode? Public storefront will become live again."
      );

      if (!confirmed) {
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = normalizeSettings(settings);
      const response = await api.put("/admin/settings", payload, authHeaders(token));
      const nextSettings = normalizeSettings(response.data);
      setSettings(nextSettings);
      setSavedSettings(nextSettings);
      toast.success("Settings saved");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save settings"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminShell title="Settings">
      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <section className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.16)] backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-white/10 p-3 text-teal-100">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Admin settings</p>
                  <h3 className="mt-2 font-display text-3xl text-white">Store control room</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
                    Keep branding, storefront copy, support info, shipping rules, and maintenance messaging aligned from one page.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetToSaved}
                  disabled={isLoading || isSaving || !isDirty}
                  className="gap-2 whitespace-nowrap"
                >
                  <RotateCcw className="h-4 w-4" />
                  Undo changes
                </Button>
                <Button type="button" onClick={() => void saveSettings()} disabled={isLoading || isSaving} className="gap-2 whitespace-nowrap">
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save settings"}
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard label="State" value={isDirty ? "Unsaved changes" : "All changes saved"} tone={isDirty ? "amber" : "emerald"} />
              <SummaryCard label="Shipping" value={`Rs. ${settings.shippingFee}`} hint={`Free above Rs. ${settings.freeShippingThreshold}`} tone="cyan" />
              <SummaryCard label="COD" value={`Rs. ${settings.codMaxOrderValue}`} hint={`${settings.returnWindowDays} day return window`} tone="white" />
              <SummaryCard label="Mode" value={settings.maintenanceMode ? "Maintenance ON" : "Store live"} hint={`Order ${settings.orderPrefix} · Invoice ${settings.invoicePrefix}`} tone={settings.maintenanceMode ? "amber" : "white"} />
            </div>
          </div>

          <SectionCard
            eyebrow="Store identity"
            title="Branding and storefront copy"
            description="These fields power the homepage message, trust strips, maintenance screen, and support surfaces."
            icon={Store}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledInput
                label="Site name"
                hint="Short customer-facing brand name."
                value={settings.siteName}
                onChange={(value) => updateField("siteName", value)}
                disabled={isLoading}
              />
              <LabeledInput
                label="Legal name"
                hint="Long-form business/legal label."
                value={settings.legalName}
                onChange={(value) => updateField("legalName", value)}
                disabled={isLoading}
              />
              <LabeledInput
                label="Announcement text"
                hint="Used for quick promo or dispatch update messaging."
                value={settings.announcementText}
                onChange={(value) => updateField("announcementText", value)}
                disabled={isLoading}
              />
              <LabeledInput
                label="Order prefix"
                hint="Used in generated order numbers."
                value={settings.orderPrefix}
                onChange={(value) => updateField("orderPrefix", value.toUpperCase().replace(/\s+/g, ""))}
                disabled={isLoading}
              />
            </div>
            <div className="mt-4 grid gap-4">
              <LabeledTextarea
                label="Hero heading"
                hint="Main homepage headline."
                value={settings.heroHeading}
                onChange={(value) => updateField("heroHeading", value)}
                rows={3}
                disabled={isLoading}
              />
              <LabeledTextarea
                label="Hero subheading"
                hint="Short supporting copy below the main headline."
                value={settings.heroSubheading}
                onChange={(value) => updateField("heroSubheading", value)}
                rows={4}
                disabled={isLoading}
              />
              <LabeledTextarea
                label="Support banner text"
                hint="Shows on homepage when support banner is enabled."
                value={settings.supportBannerText}
                onChange={(value) => updateField("supportBannerText", value)}
                rows={3}
                disabled={isLoading}
              />
              <LabeledTextarea
                label="Maintenance message"
                hint="Main headline shown on the maintenance screen."
                value={settings.maintenanceMessage}
                onChange={(value) => updateField("maintenanceMessage", value)}
                rows={3}
                disabled={isLoading}
              />
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Support desk"
            title="Support and contact details"
            description="Keep footer, maintenance mode, and support-facing touchpoints consistent."
            icon={MessageSquare}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledInput label="Support email" value={settings.supportEmail} onChange={(value) => updateField("supportEmail", value)} disabled={isLoading} />
              <LabeledInput label="Support phone" value={settings.supportPhone} onChange={(value) => updateField("supportPhone", value)} disabled={isLoading} />
              <LabeledInput label="WhatsApp number" value={settings.supportWhatsapp} onChange={(value) => updateField("supportWhatsapp", value)} disabled={isLoading} />
              <LabeledInput label="Support hours" value={settings.supportHours} onChange={(value) => updateField("supportHours", value)} disabled={isLoading} />
              <LabeledInput
                label="Address line 1"
                value={settings.addressLine1}
                onChange={(value) => updateField("addressLine1", value)}
                disabled={isLoading}
              />
              <LabeledInput
                label="Address line 2"
                value={settings.addressLine2}
                onChange={(value) => updateField("addressLine2", value)}
                disabled={isLoading}
              />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <LabeledInput
                label="Developer name"
                hint="Shown only when footer credit is enabled."
                value={settings.developerName}
                onChange={(value) => updateField("developerName", value)}
                disabled={isLoading}
              />
              <LabeledInput
                label="Developer URL"
                hint="Portfolio or contact link for the subtle footer credit."
                value={settings.developerUrl}
                onChange={(value) => updateField("developerUrl", value)}
                disabled={isLoading}
              />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ToggleCard
                label="Developer footer credit"
                description="Shows a subtle built-by line in the footer without changing the main storefront branding."
                enabled={settings.showDeveloperCredit}
                onToggle={() => updateField("showDeveloperCredit", !settings.showDeveloperCredit)}
                disabled={isLoading}
              />
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Fulfilment"
            title="Shipping, COD, and returns"
            description="Set the commercial rules buyers see at cart, checkout, and order handling."
            icon={Truck}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledNumberInput
                label="Shipping fee"
                hint="Standard shipping charge below free-shipping threshold."
                value={settings.shippingFee}
                onChange={(value) => updateField("shippingFee", value)}
                disabled={isLoading}
              />
              <LabeledNumberInput
                label="Free shipping threshold"
                hint="Orders above this amount get free shipping."
                value={settings.freeShippingThreshold}
                onChange={(value) => updateField("freeShippingThreshold", value)}
                disabled={isLoading}
              />
              <LabeledNumberInput
                label="COD max order value"
                hint="Above this amount, COD should stay unavailable."
                value={settings.codMaxOrderValue}
                onChange={(value) => updateField("codMaxOrderValue", value)}
                disabled={isLoading}
              />
              <LabeledNumberInput
                label="Return window (days)"
                hint="Use in policy copy and support decisions."
                value={settings.returnWindowDays}
                onChange={(value) => updateField("returnWindowDays", value)}
                disabled={isLoading}
              />
            </div>
            <div className="mt-4">
              <LabeledInput
                label="Blocked COD pincodes"
                hint="Comma-separated pincode list where COD should stay disabled."
                value={settings.codDisabledPincodes}
                onChange={(value) => updateField("codDisabledPincodes", value)}
                disabled={isLoading}
              />
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Billing"
            title="Invoice settings"
            description="Control invoice numbering, GST identity, support contact, and the declaration/footer copy used in the generated PDF."
            icon={ShoppingBag}
          >
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div>
                <div className="grid gap-4 md:grid-cols-2">
                  <LabeledInput
                    label="Invoice prefix"
                    hint="Used in generated invoice numbers."
                    value={settings.invoicePrefix}
                    onChange={(value) => updateField("invoicePrefix", value.toUpperCase().replace(/\s+/g, ""))}
                    disabled={isLoading}
                  />
                  <LabeledInput
                    label="Invoice GSTIN"
                    hint="Printed in the invoice header."
                    value={settings.invoiceGstin}
                    onChange={(value) => updateField("invoiceGstin", value.toUpperCase().replace(/\s+/g, ""))}
                    disabled={isLoading}
                  />
                  <LabeledInput
                    label="Invoice support email"
                    hint="Shown in the invoice header and footer."
                    value={settings.invoiceSupportEmail}
                    onChange={(value) => updateField("invoiceSupportEmail", value)}
                    disabled={isLoading}
                  />
                  <LabeledInput
                    label="Invoice support phone"
                    hint="Shown for billing support on the PDF."
                    value={settings.invoiceSupportPhone}
                    onChange={(value) => updateField("invoiceSupportPhone", value)}
                    disabled={isLoading}
                  />
                  <LabeledInput
                    label="Supply type label"
                    hint="Example: Domestic taxable supply."
                    value={settings.invoiceSupplyLabel}
                    onChange={(value) => updateField("invoiceSupplyLabel", value)}
                    disabled={isLoading}
                  />
                  <LabeledInput
                    label="Signatory label"
                    hint="Shown below the company name in the declaration block."
                    value={settings.invoiceAuthorizedSignatory}
                    onChange={(value) => updateField("invoiceAuthorizedSignatory", value)}
                    disabled={isLoading}
                  />
                  <LabeledInput
                    label="Return window label"
                    hint="Pulled from fulfilment settings for quick reference."
                    value={`${settings.returnWindowDays} day(s)`}
                    onChange={() => {}}
                    disabled
                  />
                </div>
                <div className="mt-4 grid gap-4">
                  <LabeledTextarea
                    label="Invoice footer note"
                    hint="Shown in the footer of every generated invoice PDF."
                    value={settings.invoiceFooterNote}
                    onChange={(value) => updateField("invoiceFooterNote", value)}
                    rows={3}
                    disabled={isLoading}
                  />
                  <LabeledTextarea
                    label="Invoice declaration"
                    hint="Shown in the declaration block before the signatory area."
                    value={settings.invoiceDeclaration}
                    onChange={(value) => updateField("invoiceDeclaration", value)}
                    rows={4}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/80">Invoice preview</p>
                <div className="mt-4 rounded-[20px] border border-white/10 bg-[#07111f] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{settings.siteName} Tax Invoice</p>
                      <p className="mt-1 text-sm text-white/70">{settings.legalName}</p>
                      <p className="mt-1 text-sm text-white/60">{settings.addressLine1}</p>
                      <p className="text-sm text-white/60">{settings.addressLine2}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-teal-100">GSTIN</p>
                      <p className="mt-1 text-white">{settings.invoiceGstin}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/45">Invoice no</p>
                      <p className="mt-2 font-semibold text-white">{settings.invoicePrefix}-2026-0001</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/45">Support</p>
                      <p className="mt-2 font-semibold text-white">{settings.invoiceSupportPhone}</p>
                      <p className="mt-1 text-sm text-white/65">{settings.invoiceSupportEmail}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                    <p><span className="font-semibold text-white">Supply type:</span> {settings.invoiceSupplyLabel}</p>
                    <p className="mt-2"><span className="font-semibold text-white">Signatory:</span> {settings.invoiceAuthorizedSignatory}</p>
                    <p className="mt-2"><span className="font-semibold text-white">Footer:</span> {settings.invoiceFooterNote}</p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Visibility"
            title="Feature toggles"
            description="These switches control what buyers can see and do across the storefront."
            icon={Sparkles}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <ToggleCard
                label="Maintenance mode"
                description="Pause public storefront browsing and show the maintenance screen."
                enabled={settings.maintenanceMode}
                onToggle={() => updateField("maintenanceMode", !settings.maintenanceMode)}
                disabled={isLoading}
              />
              <ToggleCard
                label="Guest checkout"
                description="Allow buyers to complete checkout without logging in first."
                enabled={settings.allowGuestCheckout}
                onToggle={() => updateField("allowGuestCheckout", !settings.allowGuestCheckout)}
                disabled={isLoading}
              />
              <ToggleCard
                label="Support banner"
                description="Show the homepage support strip with WhatsApp and bulk-buyer messaging."
                enabled={settings.showSupportBanner}
                onToggle={() => updateField("showSupportBanner", !settings.showSupportBanner)}
                disabled={isLoading}
              />
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Shortcuts"
            title="Operational links"
            description="Jump straight into adjacent admin areas while updating configuration."
            icon={Layers3}
          >
            <div className="grid gap-4 md:grid-cols-2">
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
          </SectionCard>
        </section>

        <section className="space-y-6">
          <SectionCard eyebrow="Preview" title="Live storefront snapshot" description="Quick read of what buyers will see after saving." icon={Globe}>
            <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/80">{settings.siteName}</p>
              <h4 className="mt-3 text-2xl font-semibold text-white">{settings.heroHeading}</h4>
              <p className="mt-3 text-sm leading-6 text-white/70">{settings.heroSubheading}</p>
              <div className="mt-5 inline-flex rounded-full bg-teal-500/15 px-4 py-2 text-sm font-semibold text-teal-100">
                {settings.announcementText}
              </div>
              {settings.showSupportBanner ? (
                <div className="mt-4 rounded-2xl border border-teal-300/15 bg-teal-500/10 px-4 py-3 text-sm text-teal-50/90">
                  {settings.supportBannerText}
                </div>
              ) : null}
              <div className="mt-6 space-y-2 text-sm text-white/70">
                <p>{settings.supportEmail}</p>
                <p>{settings.supportPhone}</p>
                <p>{settings.supportWhatsapp}</p>
                <p>{settings.supportHours}</p>
                <p>{settings.addressLine1}</p>
                <p>{settings.addressLine2}</p>
                {settings.showDeveloperCredit && settings.developerName ? (
                  <p className="pt-2 text-white/55">
                    Built by{" "}
                    {settings.developerUrl ? (
                      <a href={settings.developerUrl} target="_blank" rel="noreferrer" className="text-white/80 transition hover:text-white">
                        {settings.developerName}
                      </a>
                    ) : (
                      <span className="text-white/80">{settings.developerName}</span>
                    )}
                  </p>
                ) : null}
              </div>
            </div>
          </SectionCard>

          <SectionCard eyebrow="Environment" title="Current setup" description="Useful when checking if local, staging, or production config is aligned." icon={ShoppingBag}>
            <div className="space-y-4">
              {environmentRows(settings).map((row) => (
                <div key={row.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">{row.label}</p>
                  <p className="mt-2 break-all text-sm text-white/85">{row.value}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard eyebrow="Quick actions" title="Helpful admin tools" description="Use these when you want a safe baseline or a quick rules snapshot." icon={Sparkles}>
            <div className="space-y-3">
              <button
                type="button"
                onClick={resetToDefaults}
                disabled={isLoading || isSaving}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white transition hover:bg-white/10 disabled:opacity-70"
              >
                <p className="font-semibold">Load system defaults</p>
                <p className="mt-1 text-white/60">Useful when you want a clean baseline before saving new settings.</p>
              </button>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                <p className="font-semibold text-white">Current rules snapshot</p>
                <p className="mt-2">Shipping fee: Rs. {settings.shippingFee}</p>
                <p>Free shipping threshold: Rs. {settings.freeShippingThreshold}</p>
                <p>COD limit: Rs. {settings.codMaxOrderValue}</p>
                <p>Return window: {settings.returnWindowDays} day(s)</p>
                <p>Invoice prefix: {settings.invoicePrefix}</p>
                <p>Invoice GSTIN: {settings.invoiceGstin}</p>
                <p>Invoice support: {settings.invoiceSupportPhone}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                <p className="font-semibold text-white">Maintenance preview</p>
                <p className="mt-2">{settings.maintenanceMessage}</p>
              </div>
            </div>
          </SectionCard>
        </section>
      </div>
    </AdminShell>
  );
}

function SectionCard({
  eyebrow,
  title,
  description,
  icon: Icon,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof ShieldCheck;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.16)] backdrop-blur">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-white/10 p-3 text-teal-100">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">{eyebrow}</p>
          <h3 className="mt-2 font-display text-2xl text-white">{title}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">{description}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function LabeledInput({
  label,
  hint,
  value,
  onChange,
  disabled
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-white">{label}</span>
      {hint ? <span className="mt-1 block text-xs text-white/55">{hint}</span> : null}
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 border-white/10 bg-white/10 text-white placeholder:text-white/35"
        disabled={disabled}
      />
    </label>
  );
}

function LabeledNumberInput({
  label,
  hint,
  value,
  onChange,
  disabled
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-white">{label}</span>
      {hint ? <span className="mt-1 block text-xs text-white/55">{hint}</span> : null}
      <Input
        type="number"
        value={String(value)}
        onChange={(event) => onChange(Number(event.target.value || 0))}
        className="mt-2 border-white/10 bg-white/10 text-white placeholder:text-white/35"
        disabled={disabled}
      />
    </label>
  );
}

function LabeledTextarea({
  label,
  hint,
  value,
  onChange,
  rows,
  disabled
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-white">{label}</span>
      {hint ? <span className="mt-1 block text-xs text-white/55">{hint}</span> : null}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows ?? 3}
        disabled={disabled}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-teal-300 disabled:opacity-70"
      />
    </label>
  );
}

function ToggleCard({
  label,
  description,
  enabled,
  onToggle,
  disabled
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`rounded-[22px] border px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${
        enabled ? "border-teal-300/50 bg-teal-500/15 text-white" : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${enabled ? "bg-white/15 text-white" : "bg-black/20 text-white/65"}`}>
          {enabled ? "On" : "Off"}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-white/60">{description}</p>
    </button>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  tone
}: {
  label: string;
  value: string;
  hint?: string;
  tone: "emerald" | "amber" | "cyan" | "white";
}) {
  const toneClasses = {
    emerald: "border-emerald-400/25 bg-emerald-500/10",
    amber: "border-amber-400/25 bg-amber-500/10",
    cyan: "border-cyan-400/25 bg-cyan-500/10",
    white: "border-white/10 bg-white/5"
  };

  return (
    <div className={`rounded-[24px] border p-4 ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">{label}</p>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
      {hint ? <p className="mt-1 text-sm text-white/60">{hint}</p> : null}
    </div>
  );
}
