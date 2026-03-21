"use client";

import { useEffect } from "react";

const isLocalhost = (hostname: string) =>
  hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

async function clearServiceWorkers() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const keys = await window.caches.keys();
    await Promise.all(keys.map((key) => window.caches.delete(key)));
  }
}

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const run = async () => {
      try {
        if (process.env.NODE_ENV !== "production" || isLocalhost(window.location.hostname)) {
          await clearServiceWorkers();
          return;
        }

        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch (error) {
        console.error("PWA service worker registration failed", error);
      }
    };

    void run();
  }, []);

  return null;
}
