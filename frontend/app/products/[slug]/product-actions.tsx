"use client";

import { useRouter } from "next/navigation";
import { Heart, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";

export function ProductActions({ product }: { product: Product }) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const toggle = useWishlistStore((state) => state.toggle);
  const has = useWishlistStore((state) => state.has);
  const wishlistHydrated = useWishlistStore((state) => state.hasHydrated);

  return (
    <div className="space-y-4 rounded-[28px] border border-slate-200 bg-[#f7fafb] p-4">
      <div className="grid gap-3 sm:grid-cols-2">
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
          className={`h-4 w-4 ${wishlistHydrated && has(product.id) ? "fill-rose-500 text-rose-500" : "text-slate"}`}
        />
        {wishlistHydrated && has(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
      </button>
      <div className="grid gap-3 text-xs text-slate sm:grid-cols-3">
        <div className="rounded-2xl bg-white px-4 py-3">Secure payment flow</div>
        <div className="rounded-2xl bg-white px-4 py-3">Repair-shop friendly fitment</div>
        <div className="rounded-2xl bg-white px-4 py-3">Backed by warranty support</div>
      </div>
    </div>
  );
}
