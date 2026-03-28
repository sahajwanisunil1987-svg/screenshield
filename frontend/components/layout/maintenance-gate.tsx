"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { Clock3, Headset, RefreshCcw, Wrench } from "lucide-react";
import { api } from "@/lib/api";

type MaintenanceSettings = {
  siteName: string;
  supportEmail: string;
  supportPhone: string;
  supportWhatsapp: string;
  supportHours: string;
  announcementText: string;
  maintenanceMessage: string;
  maintenanceMode: boolean;
};

const fallbackSettings: MaintenanceSettings = {
  siteName: "PurjiX",
  supportEmail: "support@purjix.com",
  supportPhone: "+91 99999 99999",
  supportWhatsapp: "+91 99999 99999",
  supportHours: "Mon-Sat, 10 AM to 7 PM",
  announcementText: "We are improving the storefront experience.",
  maintenanceMessage: "We are updating the storefront and will be back shortly.",
  maintenanceMode: false
};

const CACHE_KEY = "purjix-maintenance-settings";
const CACHE_TTL_MS = 60 * 1000;

function readCachedSettings() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { timestamp: number; data: MaintenanceSettings };
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCachedSettings(data: MaintenanceSettings) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
  } catch {
    // Ignore client cache failures.
  }
}

export function MaintenanceGate({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);

  useEffect(() => {
    const cached = readCachedSettings();
    if (cached) {
      setSettings(cached);
    }

    let cancelled = false;

    const load = async () => {
      try {
        const response = await api.get("/settings/app");
        const nextSettings = { ...fallbackSettings, ...response.data } satisfies MaintenanceSettings;
        writeCachedSettings(nextSettings);
        if (!cancelled) {
          setSettings(nextSettings);
        }
      } catch {
        if (!cancelled && !cached) {
          setSettings(fallbackSettings);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!settings) {
    return (
      <div className="min-h-[60vh] bg-page-wash">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-card">
            <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-6 h-10 w-3/4 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-slate-100" />
            <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!settings.maintenanceMode) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_24%),linear-gradient(180deg,#07111f,#0b1b30)] text-white">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-[0_28px_80px_rgba(0,0,0,0.22)] backdrop-blur sm:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-white/10 p-3 text-teal-100">
              <Wrench className="h-6 w-6" />
            </div>
            <span className="rounded-full bg-amber-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">
              Maintenance mode
            </span>
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.28em] text-teal-200/80">{settings.siteName}</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
            {settings.maintenanceMessage || "We are updating the storefront and will be back shortly."}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/72 sm:text-lg">
            {settings.announcementText || "We are improving the storefront experience."} You can still reach the team for urgent help while storefront browsing is temporarily paused.
          </p>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Support email</p>
              <a href={`mailto:${settings.supportEmail}`} className="mt-3 block text-lg font-semibold text-white">
                {settings.supportEmail}
              </a>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Phone / WhatsApp</p>
              <a href={`tel:${settings.supportPhone.replace(/\s+/g, "")}`} className="mt-3 block text-lg font-semibold text-white">
                {settings.supportPhone}
              </a>
              <p className="mt-2 text-sm text-white/60">WhatsApp: {settings.supportWhatsapp}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Support hours</p>
              <div className="mt-3 flex items-start gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 text-teal-200" />
                <p className="text-lg font-semibold text-white">{settings.supportHours}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/90"
            >
              Admin login
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Headset className="mr-2 h-4 w-4" />
              Support page
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
