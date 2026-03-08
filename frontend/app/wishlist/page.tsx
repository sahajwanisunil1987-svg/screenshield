"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/components/products/product-card";
import { getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useWishlistStore } from "@/store/wishlist-store";

export default function WishlistPage() {
  const token = useAuthStore((state) => state.token);
  const items = useWishlistStore((state) => state.items);
  const syncFromServer = useWishlistStore((state) => state.syncFromServer);

  useEffect(() => {
    if (!token) {
      return;
    }

    syncFromServer().catch((error) => {
      toast.error(getApiErrorMessage(error, "Unable to load wishlist"));
    });
  }, [syncFromServer, token]);

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl text-ink">Wishlist</h1>
        <div className="mt-10">
          {items.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          ) : (
            <EmptyState title="No saved products" description="Use the wishlist to bookmark frequently ordered spare parts." />
          )}
        </div>
      </div>
    </PageShell>
  );
}
