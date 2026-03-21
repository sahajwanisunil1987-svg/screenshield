"use client";

import { useEffect, useState } from "react";
import type { PublicAppSettings } from "@/types";
import { api } from "@/lib/api";
import { DEFAULT_APP_SETTINGS } from "@/lib/app-settings";

export function useAppSettings() {
  const [settings, setSettings] = useState<PublicAppSettings>(DEFAULT_APP_SETTINGS);

  useEffect(() => {
    let active = true;

    api
      .get<PublicAppSettings>("/settings/app")
      .then((response) => {
        if (!active) return;
        setSettings({
          company: { ...DEFAULT_APP_SETTINGS.company, ...(response.data.company ?? {}) },
          site: { ...DEFAULT_APP_SETTINGS.site, ...(response.data.site ?? {}) },
          storefront: { ...DEFAULT_APP_SETTINGS.storefront, ...(response.data.storefront ?? {}) }
        });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return settings;
}
