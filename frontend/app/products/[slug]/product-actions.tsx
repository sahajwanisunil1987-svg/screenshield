"use client";

import { useRouter } from "next/navigation";
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

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={() => {
          addItem(product);
          toast.success("Added to cart");
        }}
      >
        Add to Cart
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          addItem(product);
          router.push("/checkout");
        }}
      >
        Buy Now
      </Button>
      <button
        onClick={async () => {
          try {
            const saved = await toggle(product);
            toast.success(saved ? "Added to wishlist" : "Removed from wishlist");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to update wishlist");
          }
        }}
        className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-ink"
      >
        {has(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
      </button>
    </div>
  );
}
