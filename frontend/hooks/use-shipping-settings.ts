"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ShippingSettings } from "@/types";
import { DEFAULT_SHIPPING_SETTINGS } from "@/lib/shipping-settings";

export function useShippingSettings() {
  const [settings, setSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS);

  useEffect(() => {
    let active = true;

    api
      .get<ShippingSettings>("/settings/shipping")
      .then((response) => {
        if (!active) return;
        setSettings({
          shippingFee: Number(response.data.shippingFee ?? DEFAULT_SHIPPING_SETTINGS.shippingFee),
          freeShippingThreshold: Number(response.data.freeShippingThreshold ?? DEFAULT_SHIPPING_SETTINGS.freeShippingThreshold),
          codMaxOrderValue: Number(response.data.codMaxOrderValue ?? DEFAULT_SHIPPING_SETTINGS.codMaxOrderValue),
          blockedCodPincodes: Array.isArray(response.data.blockedCodPincodes)
            ? response.data.blockedCodPincodes
            : DEFAULT_SHIPPING_SETTINGS.blockedCodPincodes
        });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return settings;
}
