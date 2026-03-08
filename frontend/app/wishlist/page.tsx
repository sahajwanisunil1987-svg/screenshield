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
  const hasHydrated = useWishlistStore((state) => state.hasHydrated);
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
          {!hasHydrated ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-panel shadow-card">
                  <div className="aspect-[4/3] bg-slate-100" />
                  <div className="space-y-4 p-5">
                    <div className="h-3 w-20 rounded-full bg-slate-100" />
                    <div className="h-6 w-3/4 rounded-full bg-slate-100" />
                    <div className="h-4 w-1/2 rounded-full bg-slate-100" />
                    <div className="h-10 rounded-full bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length ? (
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
