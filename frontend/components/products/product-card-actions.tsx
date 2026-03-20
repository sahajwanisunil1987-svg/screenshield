"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GitCompareArrows, Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Product } from "@/types";
import { useCartStore } from "@/store/cart-store";
import { useCompareStore } from "@/store/compare-store";
import { useWishlistStore } from "@/store/wishlist-store";

export function ProductCardActions({ product, stock }: { product: Product; stock: number }) {
  const [mounted, setMounted] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const toggleCompare = useCompareStore((state) => state.toggle);
  const hasCompared = useCompareStore((state) => state.has);
  const compareHydrated = useCompareStore((state) => state.hasHydrated);
  const toggle = useWishlistStore((state) => state.toggle);
  const has = useWishlistStore((state) => state.has);
  const wishlistHydrated = useWishlistStore((state) => state.hasHydrated);
  const isWishlisted = mounted && wishlistHydrated && has(product.id);
  const isCompared = mounted && compareHydrated && hasCompared(product.id);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
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
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart className={`h-4 w-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : "text-slate"}`} />
      </button>
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
    </>
  );
}
