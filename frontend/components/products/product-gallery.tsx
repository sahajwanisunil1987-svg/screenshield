"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ProductImage } from "@/types";

type GalleryItem =
  | { type: "image"; url: string; alt?: string | null }
  | { type: "video"; url: string; alt?: string | null };

export function ProductGallery({ images, productName, videoUrl }: { images: ProductImage[]; productName: string; videoUrl?: string | null }) {
  const gallery = useMemo<GalleryItem[]>(() => {
    const imageItems = (images.length ? images : [{ url: "https://placehold.co/1000x1000", alt: productName }]).map((image) => ({
      type: "image" as const,
      url: image.url,
      alt: image.alt ?? productName
    }));

    return videoUrl ? [...imageItems, { type: "video" as const, url: videoUrl, alt: `${productName} product video` }] : imageItems;
  }, [images, productName, videoUrl]);
  const [activeItem, setActiveItem] = useState(gallery[0]);

  return (
    <div className="space-y-4">
      <div className="rounded-[40px] bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.16),transparent_32%),linear-gradient(180deg,#ffffff,#eef4f7)] p-3 shadow-card">
        <div className="group relative aspect-square overflow-hidden rounded-[32px] bg-white">
{activeItem.type === "video" ? (
            <video src={activeItem.url} controls className="h-full w-full object-cover" preload="metadata" />
          ) : (
            <Image
              src={activeItem.url}
              alt={activeItem.alt ?? productName}
              fill
              className="object-cover transition duration-500 group-hover:scale-110"
            />
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-ink/70 to-transparent px-5 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-white/90">
            <span>Tap to preview</span>
            <span>{gallery.findIndex((item) => item.url === activeItem.url) + 1}/{gallery.length}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {gallery.map((item, index) => {
          const isActive = item.url === activeItem.url;

          return (
            <button
              key={`${item.url}-${index}`}
              type="button"
              onClick={() => setActiveItem(item)}
              className={`relative aspect-square overflow-hidden rounded-[24px] border-2 bg-white shadow-card transition ${
                isActive ? "border-accent ring-2 ring-accent/15" : "border-transparent hover:border-accent/40"
              }`}
            >
{item.type === "video" ? (
                <div className="flex h-full w-full items-center justify-center bg-black text-xs font-semibold uppercase tracking-[0.2em] text-white">Video</div>
              ) : (
                <Image src={item.url} alt={item.alt ?? productName} fill className="object-cover" />
              )}
            </button>
          );
        })}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[24px] bg-white p-4 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate">Dispatch</p>
          <p className="mt-2 text-sm font-semibold text-ink">Fast warehouse fulfilment</p>
        </div>
        <div className="rounded-[24px] bg-white p-4 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate">Protection</p>
          <p className="mt-2 text-sm font-semibold text-ink">Transit-safe packaging</p>
        </div>
        <div className="rounded-[24px] bg-white p-4 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate">Support</p>
          <p className="mt-2 text-sm font-semibold text-ink">Fitment help after purchase</p>
        </div>
      </div>
    </div>
  );
}
