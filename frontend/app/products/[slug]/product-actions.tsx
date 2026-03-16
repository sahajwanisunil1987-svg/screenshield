"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GitCompareArrows, Heart, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { useCompareStore } from "@/store/compare-store";
import { useWishlistStore } from "@/store/wishlist-store";

export function ProductActions({ product }: { product: Product }) {
  const router = useRouter();
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
    <div className="space-y-4 rounded-[28px] border border-slate-200 bg-[#f7fafb] p-4">
      <div className="grid gap-3">
        <Button
          className="justify-center gap-2"
          onClick={() => {
            addItem(product);
            toast.success("Added to cart");
          }}
        >
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </Button>
        <Button
          variant="secondary"
          className="justify-center gap-2"
          onClick={() => {
            addItem(product);
            router.push("/checkout");
          }}
        >
          <Zap className="h-4 w-4" />
          Buy Now
        </Button>
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
        className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-accent/30 hover:bg-accentSoft"
      >
        <Heart
          className={`h-4 w-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : "text-slate"}`}
        />
        {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
      </button>
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
        {isCompared ? "Remove from Compare" : "Add to Compare"}
      </button>
      <div className="flex flex-wrap gap-2 text-xs text-slate">
        <div className="rounded-full bg-white px-4 py-2.5">Secure payment flow</div>
        <div className="rounded-full bg-white px-4 py-2.5">Repair-shop friendly fitment</div>
        <div className="rounded-full bg-white px-4 py-2.5">Warranty-backed support</div>
      </div>
    </div>
  );
}
