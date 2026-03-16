"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GitCompareArrows, Heart, ShieldCheck, ShoppingCart, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import { Product } from "@/types";
import { Button } from "../ui/button";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useCompareStore } from "@/store/compare-store";
import { useWishlistStore } from "@/store/wishlist-store";

export function ProductCard({ product }: { product: Product }) {
  const [mounted, setMounted] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const toggleCompare = useCompareStore((state) => state.toggle);
  const hasCompared = useCompareStore((state) => state.has);
  const compareHydrated = useCompareStore((state) => state.hasHydrated);
  const toggle = useWishlistStore((state) => state.toggle);
  const has = useWishlistStore((state) => state.has);
  const wishlistHydrated = useWishlistStore((state) => state.hasHydrated);
  const discount =
    product.comparePrice && product.comparePrice > product.price ? product.comparePrice - product.price : 0;
  const stock = product.inventory?.stock ?? product.stock;
  const isLowStock = stock > 0 && stock <= (product.inventory?.lowStockLimit ?? 5);
  const compatibilityCount = product.compatibilityModels?.length ?? 0;
  const primaryCompatibility = compatibilityCount ? product.compatibilityModels?.[0]?.model.name : null;
  const isWishlisted = mounted && wishlistHydrated && has(product.id);
  const isCompared = mounted && compareHydrated && hasCompared(product.id);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="group overflow-hidden rounded-[30px] border border-slate-200/80 bg-panel shadow-card transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_80px_rgba(8,17,31,0.12)]">
      <Link href={`/products/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          src={product.images[0]?.url ?? "https://placehold.co/600x400"}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink/10" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {product.isFeatured ? (
            <span className="rounded-full bg-white/92 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink shadow-sm">
              Featured
            </span>
          ) : null}
          {discount ? (
            <span className="rounded-full bg-[#ffe8d6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b45309]">
              Save {formatCurrency(discount)}
            </span>
          ) : null}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/25 to-transparent opacity-0 transition group-hover:opacity-100" />
      </Link>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{product.brand.name}</p>
            <Link href={`/products/${product.slug}`} className="mt-2 block text-lg font-semibold text-ink">
              {product.name}
            </Link>
            <p className="mt-1 text-sm text-slate">
              {product.model.name}
              {compatibilityCount > 1 ? ` + ${compatibilityCount - 1} more models` : ""}
            </p>
          </div>
          <button
            onClick={async () => {
              try {
                const saved = await toggle(product);
                toast.success(saved ? "Added to wishlist" : "Removed from wishlist");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Unable to update wishlist");
              }
            }}
            className="rounded-full border border-slate-200 bg-white/90 p-2 transition hover:border-accent/30 hover:bg-accentSoft"
          >
            <Heart
              className={`h-4 w-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : "text-slate"}`}
            />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              stock > 0
                ? isLowStock
                  ? "bg-[#fff1dc] text-[#b45309]"
                  : "bg-[#e2f7ef] text-[#0f766e]"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {stock > 0 ? (isLowStock ? `Only ${stock} left` : "In stock") : "Out of stock"}
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate shadow-sm">
            SKU {product.sku}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span>{product.averageRating.toFixed(1)}</span>
          <span>({product.reviewCount})</span>
          <span className="text-slate-300">•</span>
          <span>{product.category.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-ink">{formatCurrency(product.price)}</span>
          {product.comparePrice ? (
            <span className="text-sm text-slate line-through">{formatCurrency(product.comparePrice)}</span>
          ) : null}
        </div>
        <div className="grid gap-2 rounded-[24px] bg-white/80 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-accent" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">Warranty</p>
              <p className="mt-1 text-sm font-medium text-ink">{product.warrantyMonths} month warranty</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Truck className="mt-0.5 h-4 w-4 text-accent" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">Compatibility</p>
              <p className="mt-1 text-sm font-medium text-ink">
                {primaryCompatibility ?? product.model.name}
                {compatibilityCount > 1 ? ` +${compatibilityCount - 1}` : ""}
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            className="flex-1"
            disabled={stock <= 0}
            onClick={() => {
              addItem(product);
              toast.success("Added to cart");
            }}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {stock > 0 ? "Add to Cart" : "Out of Stock"}
          </Button>
          <Link
            href={`/products/${product.slug}`}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-ink transition hover:border-accent/30 hover:bg-accentSoft"
          >
            View
          </Link>
        </div>
        <button
          type="button"
          onClick={() => {
            const result = toggleCompare(product);
            if (result.limitReached) {
              toast.error("You can compare up to 4 products at a time");
              return;
            }

            toast.success(result.active ? "Added to compare" : "Removed from compare");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-accent/30 hover:bg-accentSoft"
        >
          <GitCompareArrows className={`h-4 w-4 ${isCompared ? "text-accent" : "text-slate"}`} />
          {isCompared ? "Remove from Compare" : "Compare Product"}
        </button>
      </div>
    </div>
  );
}
