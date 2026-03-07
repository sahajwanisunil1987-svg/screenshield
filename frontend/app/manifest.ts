import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SpareKart",
    short_name: "SpareKart",
    description: "Mobile spare parts store with smart search, cart, checkout, and admin tools.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f7f6",
    theme_color: "#0f766e",
    orientation: "portrait",
    lang: "en",
    scope: "/",
    categories: ["shopping", "business"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/maskable-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
