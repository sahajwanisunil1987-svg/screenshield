"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { DEFAULT_APP_SETTINGS } from "@/lib/app-settings";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type { PublicAppSettings } from "@/types";

type ShippingSettingsForm = {
  shippingFee: string;
  freeShippingThreshold: string;
  codMaxOrderValue: string;
  blockedCodPincodes: string;
};

type AppSettingsForm = {
  companyName: string;
  legalName: string;
  gstin: string;
  supportPhone: string;
  supportEmail: string;
  addressLine1: string;
  addressLine2: string;
  siteName: string;
  navbarSearchPlaceholder: string;
  homeEyebrow: string;
  homeTitle: string;
  homeDescription: string;
  footerEyebrow: string;
  footerTitle: string;
  footerDescription: string;
};

export default function AdminDashboardPage() {
  const token = useAuthStore((state) => state.token);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [shippingSettings, setShippingSettings] = useState<ShippingSettingsForm>({
    shippingFee: "79",
    freeShippingThreshold: "999",
    codMaxOrderValue: "5000",
    blockedCodPincodes: "560001, 110001"
  });
  const [isSavingShippingSettings, setIsSavingShippingSettings] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettingsForm>({
    companyName: DEFAULT_APP_SETTINGS.company.companyName,
    legalName: DEFAULT_APP_SETTINGS.company.legalName,
    gstin: DEFAULT_APP_SETTINGS.company.gstin,
    supportPhone: DEFAULT_APP_SETTINGS.company.supportPhone,
    supportEmail: DEFAULT_APP_SETTINGS.company.supportEmail,
    addressLine1: DEFAULT_APP_SETTINGS.company.addressLine1,
    addressLine2: DEFAULT_APP_SETTINGS.company.addressLine2,
    siteName: DEFAULT_APP_SETTINGS.site.siteName,
    navbarSearchPlaceholder: DEFAULT_APP_SETTINGS.site.navbarSearchPlaceholder,
    homeEyebrow: DEFAULT_APP_SETTINGS.storefront.homeEyebrow,
    homeTitle: DEFAULT_APP_SETTINGS.storefront.homeTitle,
    homeDescription: DEFAULT_APP_SETTINGS.storefront.homeDescription,
    footerEyebrow: DEFAULT_APP_SETTINGS.storefront.footerEyebrow,
    footerTitle: DEFAULT_APP_SETTINGS.storefront.footerTitle,
    footerDescription: DEFAULT_APP_SETTINGS.storefront.footerDescription
  });
  const [isSavingAppSettings, setIsSavingAppSettings] = useState(false);

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    api
      .get("/admin/dashboard", {
        ...authHeaders(token),
        params: { range }
      })
      .then((response) => setData(response.data))
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load dashboard"));
      })
      .finally(() => setIsLoading(false));
  }, [range, token]);

  useEffect(() => {
    if (!token) return;
    api
      .get("/admin/settings/shipping", authHeaders(token))
      .then((response) => {
        setShippingSettings({
          shippingFee: String(response.data.shippingFee ?? 79),
          freeShippingThreshold: String(response.data.freeShippingThreshold ?? 999),
          codMaxOrderValue: String(response.data.codMaxOrderValue ?? 5000),
          blockedCodPincodes: Array.isArray(response.data.blockedCodPincodes)
            ? response.data.blockedCodPincodes.join(", ")
            : ""
        });
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load shipping settings"));
      });
  }, [token]);

  useEffect(() => {
    if (!token) return;
    api
      .get<PublicAppSettings>("/admin/settings/app", authHeaders(token))
      .then((response) => {
        setAppSettings({
          companyName: response.data.company.companyName,
          legalName: response.data.company.legalName,
          gstin: response.data.company.gstin,
          supportPhone: response.data.company.supportPhone,
          supportEmail: response.data.company.supportEmail,
          addressLine1: response.data.company.addressLine1,
          addressLine2: response.data.company.addressLine2,
          siteName: response.data.site.siteName,
          navbarSearchPlaceholder: response.data.site.navbarSearchPlaceholder,
          homeEyebrow: response.data.storefront.homeEyebrow,
          homeTitle: response.data.storefront.homeTitle,
          homeDescription: response.data.storefront.homeDescription,
          footerEyebrow: response.data.storefront.footerEyebrow,
          footerTitle: response.data.storefront.footerTitle,
          footerDescription: response.data.storefront.footerDescription
        });
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load app settings"));
      });
  }, [token]);

  const saveShippingSettings = async () => {
    if (!token) return;
    try {
      setIsSavingShippingSettings(true);
      const response = await api.patch(
        "/admin/settings/shipping",
        {
          shippingFee: Number(shippingSettings.shippingFee || 0),
          freeShippingThreshold: Number(shippingSettings.freeShippingThreshold || 0),
          codMaxOrderValue: Number(shippingSettings.codMaxOrderValue || 0),
          blockedCodPincodes: shippingSettings.blockedCodPincodes
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean)
        },
        authHeaders(token)
      );
      setShippingSettings({
        shippingFee: String(response.data.shippingFee),
        freeShippingThreshold: String(response.data.freeShippingThreshold),
        codMaxOrderValue: String(response.data.codMaxOrderValue),
        blockedCodPincodes: response.data.blockedCodPincodes.join(", ")
      });
      toast.success("Shipping settings updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save shipping settings"));
    } finally {
      setIsSavingShippingSettings(false);
    }
  };

  const saveAppSettings = async () => {
    if (!token) return;
    try {
      setIsSavingAppSettings(true);
      const response = await api.patch<PublicAppSettings>(
        "/admin/settings/app",
        {
          company: {
            companyName: appSettings.companyName,
            legalName: appSettings.legalName,
            gstin: appSettings.gstin,
            supportPhone: appSettings.supportPhone,
            supportEmail: appSettings.supportEmail,
            addressLine1: appSettings.addressLine1,
            addressLine2: appSettings.addressLine2
          },
          site: {
            siteName: appSettings.siteName,
            navbarSearchPlaceholder: appSettings.navbarSearchPlaceholder
          },
          storefront: {
            homeEyebrow: appSettings.homeEyebrow,
            homeTitle: appSettings.homeTitle,
            homeDescription: appSettings.homeDescription,
            footerEyebrow: appSettings.footerEyebrow,
            footerTitle: appSettings.footerTitle,
            footerDescription: appSettings.footerDescription
          }
        },
        authHeaders(token)
      );
      setAppSettings({
        companyName: response.data.company.companyName,
        legalName: response.data.company.legalName,
        gstin: response.data.company.gstin,
        supportPhone: response.data.company.supportPhone,
        supportEmail: response.data.company.supportEmail,
        addressLine1: response.data.company.addressLine1,
        addressLine2: response.data.company.addressLine2,
        siteName: response.data.site.siteName,
        navbarSearchPlaceholder: response.data.site.navbarSearchPlaceholder,
        homeEyebrow: response.data.storefront.homeEyebrow,
        homeTitle: response.data.storefront.homeTitle,
        homeDescription: response.data.storefront.homeDescription,
        footerEyebrow: response.data.storefront.footerEyebrow,
        footerTitle: response.data.storefront.footerTitle,
        footerDescription: response.data.storefront.footerDescription
      });
      toast.success("App settings updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save app settings"));
    } finally {
      setIsSavingAppSettings(false);
    }
  };

  const stats = useMemo(
    () => [
      {
        label: "Net Orders",
        value: data?.stats?.totalOrders ?? 0,
        detail: `Valid orders in the last ${range.replace("d", "")} days`,
        accent: "text-cyan-200"
      },
      {
        label: "Net Revenue",
        value: formatCurrency(data?.stats?.totalRevenue ?? 0),
        detail: "Cancelled and approved-return orders excluded",
        accent: "text-emerald-200"
      },
      {
        label: "Pending Approvals",
        value: (data?.stats?.pendingCancelApprovals ?? 0) + (data?.stats?.pendingReturnApprovals ?? 0),
        detail: "Cancellation and return requests awaiting review",
        accent: "text-rose-200"
      },
      {
        label: "Dispatch Queue",
        value: (data?.stats?.awaitingPacking ?? 0) + (data?.stats?.awaitingShipment ?? 0),
        detail: "Orders waiting for packing or shipment",
        accent: "text-amber-200"
      }
    ],
    [data, range]
  );

  const topSellerMax = Math.max(...(data?.topProducts?.map((product: any) => Number(product.quantity ?? 0)) ?? [1]));
  const lowStockCriticalCount = data?.lowStock?.filter((item: any) => item.stock <= Math.max(1, Math.floor(item.lowStockLimit / 2))).length ?? 0;
  const fulfilledCount = data?.stats?.fulfilledOrders ?? 0;
  const trendMax = Math.max(...(data?.trend?.map((point: any) => Number(point.revenue ?? 0)) ?? [1]));

  return (
    <AdminGuard>
      <AdminShell title="Dashboard">
        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <div className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/70">SpareKart control room</p>
                <div>
                  <h2 className="font-display text-3xl text-white">Operations snapshot</h2>
                  <p className="mt-2 max-w-2xl text-sm text-white/65">
                    Monitor order flow, watch low-stock pressure, and jump straight into the admin modules that need action.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["7d", "30d", "90d"] as const).map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => setRange(entry)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                      range === entry
                        ? "bg-white text-ink"
                        : "border border-white/15 text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {entry}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/55">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Net sales view</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Cancelled and approved returns are excluded</span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="min-w-0 rounded-[28px] border border-white/10 bg-black/15 p-5">
                  <p className="text-sm text-white/60">{stat.label}</p>
                  <p className={`mt-3 break-words font-display text-[clamp(2.2rem,3vw,3.8rem)] leading-[0.92] ${stat.accent}`}>{isLoading ? "..." : stat.value}</p>
                  <p className="mt-2 max-w-[16rem] text-xs leading-5 text-white/45">{stat.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Today&apos;s focus</p>
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 p-4">
                  <p className="text-sm text-rose-100/80">Pending approvals</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {isLoading ? "..." : (data?.stats?.pendingCancelApprovals ?? 0) + (data?.stats?.pendingReturnApprovals ?? 0)}
                  </p>
                  <p className="mt-1 text-xs text-white/55">
                    {data?.stats?.pendingCancelApprovals ?? 0} cancel and {data?.stats?.pendingReturnApprovals ?? 0} return requests
                  </p>
                </div>
                <div className="rounded-[24px] border border-amber-400/20 bg-amber-500/10 p-4">
                  <p className="text-sm text-amber-100/80">Dispatch queue</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{isLoading ? "..." : (data?.stats?.awaitingPacking ?? 0) + (data?.stats?.awaitingShipment ?? 0)}</p>
                  <p className="mt-1 text-xs text-white/55">
                    {data?.stats?.awaitingPacking ?? 0} awaiting packing, {data?.stats?.awaitingShipment ?? 0} awaiting shipment
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-black/10 p-4">
                  <p className="text-sm text-white/60">Low-stock alerts</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{isLoading ? "..." : data?.stats?.lowStockCount ?? 0}</p>
                  <p className="mt-1 text-xs text-white/45">{lowStockCriticalCount} items are in the critical band</p>
                </div>
                <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 p-4">
                  <p className="text-sm text-emerald-100/80">Fulfilment pulse</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{isLoading ? "..." : fulfilledCount}</p>
                  <p className="mt-1 text-xs text-white/55">{data?.stats?.deliveredToday ?? 0} delivered today in production</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/admin/orders"
                  className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Review orders
                </Link>
                <Link
                  href="/admin/inventory"
                  className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Update inventory
                </Link>
                <Link
                  href="/admin/orders"
                  className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Review returns
                </Link>
                <Link
                  href="/admin/products/new"
                  className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Create product
                </Link>
              </div>
            </div>
          </div>
        </div>

        <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Shipping settings</p>
              <h3 className="mt-2 font-display text-2xl text-white">Control shipping, free-shipping, and COD rules</h3>
              <p className="mt-2 max-w-3xl text-sm text-white/60">These values drive cart summary, checkout pricing, and backend COD validation together.</p>
            </div>
            <button
              type="button"
              onClick={saveShippingSettings}
              disabled={isSavingShippingSettings}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingShippingSettings ? "Saving..." : "Save shipping settings"}
            </button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            <label className="space-y-2 text-sm text-white/70">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Shipping fee</span>
              <input
                value={shippingSettings.shippingFee}
                onChange={(event) => setShippingSettings((current) => ({ ...current, shippingFee: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink"
                inputMode="numeric"
              />
            </label>
            <label className="space-y-2 text-sm text-white/70">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Free shipping above</span>
              <input
                value={shippingSettings.freeShippingThreshold}
                onChange={(event) => setShippingSettings((current) => ({ ...current, freeShippingThreshold: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink"
                inputMode="numeric"
              />
            </label>
            <label className="space-y-2 text-sm text-white/70">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/45">COD max order</span>
              <input
                value={shippingSettings.codMaxOrderValue}
                onChange={(event) => setShippingSettings((current) => ({ ...current, codMaxOrderValue: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink"
                inputMode="numeric"
              />
            </label>
            <label className="space-y-2 text-sm text-white/70">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Blocked COD pincodes</span>
              <input
                value={shippingSettings.blockedCodPincodes}
                onChange={(event) => setShippingSettings((current) => ({ ...current, blockedCodPincodes: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink"
                placeholder="560001, 110001"
              />
            </label>
          </div>
        </section>


        <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Company and storefront settings</p>
              <h3 className="mt-2 font-display text-2xl text-white">Control brand name, contact info, and homepage copy</h3>
              <p className="mt-2 max-w-3xl text-sm text-white/60">
                These values drive navbar branding, footer contact info, support pages, homepage hero copy, and invoice company details.
              </p>
            </div>
            <button
              type="button"
              onClick={saveAppSettings}
              disabled={isSavingAppSettings}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingAppSettings ? "Saving..." : "Save app settings"}
            </button>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-black/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Company details</p>
              <div className="mt-4 grid gap-4">
                <label className="space-y-2 text-sm text-white/70"><span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Company name</span><input value={appSettings.companyName} onChange={(event) => setAppSettings((current) => ({ ...current, companyName: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink" /></label>
                <label className="space-y-2 text-sm text-white/70"><span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Legal name</span><input value={appSettings.legalName} onChange={(event) => setAppSettings((current) => ({ ...current, legalName: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink" /></label>
                <label className="space-y-2 text-sm text-white/70"><span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/45">GSTIN</span><input value={appSettings.gstin} onChange={(event) => setAppSettings((current) => ({ ...current, gstin: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink" /></label>
                <label className="space-y-2 text-sm text-white/70"><span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Support email</span><input value={appSettings.supportEmail} onChange={(event) => setAppSettings((current) => ({ ...current, supportEmail: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink" /></label>
                <label className="space-y-2 text-sm text-white/70"><span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Support phone</span><input value={appSettings.supportPhone} onChange={(event) => setAppSettings((current) => ({ ...current, supportPhone: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink" /></label>
                <label className="space-y-2 text-sm text-white/70"><span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Address line 1</span><input value={appSettings.addressLine1} onChange={(event) => setAppSettings((current) => ({ ...current, addressLine1: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink" /></label>
                <label className="space-y-2 text-sm text-white/70"><span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Address line 2</span><input value={appSettings.addressLine2} onChange={(event) => setAppSettings((current) => ({ ...current, addressLine2: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink" /></label>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-black/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Site settings</p>
              <div className="mt-4 grid gap-4">
                <label className="space-y-2 text-sm text-white/70"><span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Site name</span><input value={appSettings.siteName} onChange={(event) => setAppSettings((current) => ({ ...current, siteName: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink" /></label>
                <label className="space-y-2 text-sm text-white/70"><span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Navbar search placeholder</span><input value={appSettings.navbarSearchPlaceholder} onChange={(event) => setAppSettings((current) => ({ ...current, navbarSearchPlaceholder: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink" /></label>
              </div>

              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Homepage hero</p>
              <div className="mt-4 grid gap-4">
                <label className="space-y-2 text-sm text-white/70"><span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Eyebrow</span><input value={appSettings.homeEyebrow} onChange={(event) => setAppSettings((current) => ({ ...current, homeEyebrow: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink" /></label>
                <label className="space-y-2 text-sm text-white/70"><span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Title</span><input value={appSettings.homeTitle} onChange={(event) => setAppSettings((current) => ({ ...current, homeTitle: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink" /></label>
                <label className="space-y-2 text-sm text-white/70"><span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Description</span><textarea value={appSettings.homeDescription} onChange={(event) => setAppSettings((current) => ({ ...current, homeDescription: event.target.value }))} className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink" /></label>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-black/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Footer content</p>
              <div className="mt-4 grid gap-4">
                <label className="space-y-2 text-sm text-white/70"><span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Eyebrow</span><input value={appSettings.footerEyebrow} onChange={(event) => setAppSettings((current) => ({ ...current, footerEyebrow: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink" /></label>
                <label className="space-y-2 text-sm text-white/70"><span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Title</span><input value={appSettings.footerTitle} onChange={(event) => setAppSettings((current) => ({ ...current, footerTitle: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink" /></label>
                <label className="space-y-2 text-sm text-white/70"><span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Description</span><textarea value={appSettings.footerDescription} onChange={(event) => setAppSettings((current) => ({ ...current, footerDescription: event.target.value }))} className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink" /></label>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Revenue trend</h3>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">{range} view</span>
            </div>
            <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(24px,1fr))] items-end gap-3">
              {isLoading
                ? Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="h-28 animate-pulse rounded-t-[18px] bg-white/5" />
                  ))
                : data?.trend?.map((point: any) => {
                    const height = Math.max(14, Math.round((Number(point.revenue ?? 0) / trendMax) * 160));
                    return (
                      <div key={point.date} className="space-y-2 text-center">
                        <div className="flex h-44 items-end justify-center">
                          <div
                            className="w-full rounded-t-[18px] bg-gradient-to-t from-cyan-400 to-emerald-300"
                            style={{ height: `${height}px` }}
                            title={`${point.label}: ${formatCurrency(Number(point.revenue ?? 0))} · ${point.orders} orders`}
                          />
                        </div>
                        <p className="text-[11px] text-white/45">{point.label}</p>
                      </div>
                    );
                  })}
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Recent orders</h3>
              <Link href="/admin/orders" className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-[24px] bg-white/5" />
                ))
              ) : data?.recentOrders?.length ? (
                data.recentOrders.map((order: any) => (
                  <div key={order.id} className="rounded-[24px] border border-white/10 bg-black/10 p-4 text-white/80">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{order.orderNumber}</p>
                        <p className="mt-1 text-white/50">{order.user?.name}</p>
                        <p className="mt-1 text-xs text-white/40">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
                          {order.status}
                        </span>
                        <p className="mt-3 text-sm text-white/60">{formatCurrency(Number(order.totalAmount ?? 0))}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-4 py-8 text-center text-white/50">
                  No recent orders yet. As soon as orders start moving, this panel will surface the latest operational activity.
                </p>
              )}
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Top sellers</h3>
              <Link href="/admin/products" className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                Manage catalog
              </Link>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-12 animate-pulse rounded-[18px] bg-white/5" />
                ))
              ) : data?.topProducts?.length ? (
                data.topProducts.map((product: any, index: number) => {
                  const quantity = Number(product.quantity ?? 0);
                  const width = Math.max(12, Math.round((quantity / topSellerMax) * 100));

                  return (
                    <div key={product.productId} className="rounded-[22px] border border-white/10 bg-black/10 p-4 text-white/80">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">
                            {index + 1}. {product.productName}
                          </p>
                          <p className="mt-1 text-xs text-white/45">Units sold in completed orders</p>
                        </div>
                        <span className="text-sm font-semibold text-white">{quantity}</span>
                      </div>
                      <div className="mt-3 h-2.5 rounded-full bg-white/5">
                        <div className="h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-4 py-8 text-center text-white/50">
                  No net product sales in this range yet. Completed sales will surface here automatically.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Sales mix</h3>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Brand / category / model</span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {[
                { title: "Top brands", items: data?.topBrands ?? [] },
                { title: "Top categories", items: data?.topCategories ?? [] },
                { title: "Top models", items: data?.topModels ?? [] }
              ].map((section) => (
                <div key={section.title} className="rounded-[22px] border border-white/10 bg-black/10 p-4">
                  <p className="text-sm font-semibold text-white">{section.title}</p>
                  <div className="mt-3 space-y-3 text-sm text-white/75">
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="h-8 animate-pulse rounded-full bg-white/5" />
                      ))
                    ) : section.items.length ? (
                      section.items.map((item: any) => (
                        <div key={item.name} className="flex items-center justify-between gap-3">
                          <span>{item.name}</span>
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">{item.quantity}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-white/45">No net sales data in this range.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Low stock alerts</h3>
              <Link href="/admin/inventory" className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                Open inventory
              </Link>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-14 animate-pulse rounded-[18px] bg-white/5" />
                ))
              ) : data?.lowStock?.length ? (
                data.lowStock.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-black/10 p-4 text-white/80">
                    <div>
                      <p className="font-medium text-white">{item.product.name}</p>
                      <p className="mt-1 text-xs text-white/45">SKU {item.product.sku}</p>
                    </div>
                    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
                      {item.stock}/{item.lowStockLimit}
                    </span>
                  </div>
                ))
              ) : (
                <p className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-4 py-8 text-center text-white/50">
                  No low stock alerts right now.
                </p>
              )}
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Recent customers</h3>
              <Link href="/admin/users" className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                View customers
              </Link>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-14 animate-pulse rounded-[18px] bg-white/5" />
                ))
              ) : data?.users?.length ? (
                data.users.slice(0, 6).map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-black/10 p-4 text-white/80">
                    <div>
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="text-white/50">{user.email}</p>
                    </div>
                    <span className="text-xs text-white/45">
                      {formatDate(user.createdAt)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-4 py-8 text-center text-white/50">
                  No customers registered yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
