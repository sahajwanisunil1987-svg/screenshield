import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PurjiX",
    short_name: "PurjiX",
    description: "Mobile spare parts store : PurjiX",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f7fb",
    theme_color: "#f4f7fb",
    orientation: "portrait",
    lang: "en",
    scope: "/",
    categories: ["shopping", "business"],
    icons: [
      {
        src: "/icon-192.png?v=px-20260518",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon-512.png?v=px-20260518",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/maskable-icon.png?v=px-20260518",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
