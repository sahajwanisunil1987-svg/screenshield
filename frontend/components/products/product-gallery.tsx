"use client";

import { type MouseEvent, useMemo, useState } from "react";
import Image from "next/image";
import { Expand, X } from "lucide-react";
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });

  const handleImageMouseMove = (event: MouseEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    setZoomOrigin({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y))
    });
  };

  const handleItemChange = (item: GalleryItem) => {
    setActiveItem(item);
    setIsZoomed(false);
    setZoomOrigin({ x: 50, y: 50 });
  };

  return (
    <>
      <div className="space-y-3 sm:space-y-4">
        <div className="rounded-[28px] bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.16),transparent_32%),linear-gradient(180deg,#ffffff,#eef4f7)] p-2.5 shadow-card sm:rounded-[40px] sm:p-3">
          <div className="group relative aspect-[4/3] overflow-hidden rounded-[24px] border border-white/70 bg-white sm:aspect-square sm:rounded-[32px]">
            <div className="absolute inset-0 bg-spare-grid opacity-70" />
            {activeItem.type === "video" ? (
              <video src={activeItem.url} controls className="relative z-[1] h-full w-full object-contain p-2 sm:p-4" preload="metadata" />
            ) : (
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleImageMouseMove}
                className="absolute inset-0 z-[1] hidden cursor-zoom-in items-center justify-center sm:flex"
                aria-label={`Open full preview of ${activeItem.alt ?? productName}`}
              >
                <Image
                  src={activeItem.url}
                  alt={activeItem.alt ?? productName}
                  fill
                  className="object-contain p-6 transition duration-300 ease-out"
                  style={{
                    transform: isZoomed ? "scale(1.85)" : "scale(1)",
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`
                  }}
                />
              </button>
            )}
            {activeItem.type === "image" ? (
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="absolute inset-0 z-[1] flex items-center justify-center sm:hidden"
                aria-label={`Open full preview of ${activeItem.alt ?? productName}`}
              >
                <Image
                  src={activeItem.url}
                  alt={activeItem.alt ?? productName}
                  fill
                  className="object-contain p-3 transition duration-500 group-hover:scale-[1.04] sm:p-6"
                />
              </button>
            ) : null}
            {activeItem.type === "image" ? (
              <div className="pointer-events-none absolute inset-0 z-[1] hidden bg-[radial-gradient(circle_at_center,transparent_0,transparent_58%,rgba(15,23,42,0.08)_100%)] opacity-0 transition duration-200 group-hover:opacity-100 sm:block" />
            ) : null}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex items-center justify-between bg-gradient-to-t from-ink/75 via-ink/35 to-transparent px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90 sm:px-5 sm:py-4 sm:text-xs sm:tracking-[0.24em]">
              <span>{activeItem.type === "image" ? "Hover to zoom" : "Full part preview"}</span>
              <span>{gallery.findIndex((item) => item.url === activeItem.url) + 1}/{gallery.length}</span>
            </div>
            {activeItem.type === "image" ? (
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="absolute right-3 top-3 z-[2] inline-flex items-center gap-1.5 rounded-full bg-white/92 px-2.5 py-1.5 text-[11px] font-semibold text-ink shadow-card transition hover:bg-white sm:right-4 sm:top-4 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs"
              >
                <Expand className="h-3.5 w-3.5" />
                Inspect
              </button>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2.5 overflow-x-auto pb-1 sm:gap-3">
          {gallery.map((item, index) => {
            const isActive = item.url === activeItem.url;

            return (
              <button
                key={`${item.url}-${index}`}
                type="button"
                onClick={() => handleItemChange(item)}
                className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-[20px] border-2 bg-white shadow-card transition sm:w-28 sm:rounded-[24px] ${
                  isActive ? "border-accent ring-2 ring-accent/15" : "border-transparent hover:border-accent/40"
                }`}
              >
                <div className="absolute inset-0 bg-spare-grid opacity-60" />
                {item.type === "video" ? (
                  <div className="relative z-[1] flex h-full w-full items-center justify-center bg-black text-xs font-semibold uppercase tracking-[0.2em] text-white">Video</div>
                ) : (
                  <Image src={item.url} alt={item.alt ?? productName} fill className="object-contain p-1.5 sm:p-2" />
                )}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-ink shadow-card sm:px-4 sm:py-2 sm:text-xs">Full image visible</div>
          <div className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-ink shadow-card sm:px-4 sm:py-2 sm:text-xs">Closer part inspection</div>
          <div className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-ink shadow-card sm:px-4 sm:py-2 sm:text-xs">Fitment details clearer</div>
        </div>
      </div>
      {isPreviewOpen && activeItem.type === "image" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(false)}
            className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <X className="h-4 w-4" />
            Close
          </button>
          <div className="relative h-[82vh] w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#0b1727,#09111d)]">
            <div className="absolute inset-0 bg-spare-grid opacity-20" />
            <Image
              src={activeItem.url}
              alt={activeItem.alt ?? productName}
              fill
              className="object-contain p-6 sm:p-10"
              sizes="100vw"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
