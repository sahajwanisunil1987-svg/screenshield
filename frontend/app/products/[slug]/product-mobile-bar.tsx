"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { Product, ProductVariant } from "@/types";

export function ProductMobileBar({
  product,
  stock,
  price,
  selectedVariant
}: {
  product: Product;
  stock: number;
  price?: number;
  selectedVariant?: ProductVariant | null;
}) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur xl:hidden">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate">
              <span className="font-semibold text-ink">{formatCurrency(price ?? product.price)}</span>
              <span className={stock > 0 ? "text-emerald-600" : "text-rose-500"}>
                {stock > 0 ? "In stock" : "Out of stock"}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="secondary"
              className="h-11 gap-1.5 px-3.5 text-sm"
              onClick={() => {
                addItem(product, selectedVariant);
                toast.success("Added to cart");
              }}
            >
              <ShoppingCart className="h-4 w-4" />
              Cart
            </Button>
            <Button
              className="h-11 gap-1.5 px-3.5 text-sm"
              onClick={() => {
                addItem(product, selectedVariant);
                router.push("/checkout");
              }}
            >
              <Zap className="h-4 w-4" />
              Buy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
