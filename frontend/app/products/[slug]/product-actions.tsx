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
        onClick={() => {
          toggle(product);
          toast.success("Wishlist updated");
        }}
        className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-ink"
      >
        Add to Wishlist
      </button>
    </div>
  );
}
