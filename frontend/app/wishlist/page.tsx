"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/components/products/product-card";
import { getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";

export default function WishlistPage() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const items = useWishlistStore((state) => state.items);
  const hasHydrated = useWishlistStore((state) => state.hasHydrated);
  const syncFromServer = useWishlistStore((state) => state.syncFromServer);
  const addItem = useCartStore((state) => state.addItem);

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
        <div className="mt-6 grid gap-4 rounded-[32px] border border-slate-200/80 bg-panel p-5 shadow-card lg:grid-cols-[1.5fr_0.85fr_0.85fr]">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
              <Sparkles className="h-4 w-4" />
              Saved shortlist
            </p>
            <p className="mt-3 text-sm text-slate">
              Keep fast-moving parts, repeat workshop items, and compatibility candidates here before moving them into cart.
            </p>
            {!user ? (
              <p className="mt-3 text-sm font-medium text-[#b45309]">
                Sign in to keep your wishlist synced across sessions and devices.
              </p>
            ) : (
              <p className="mt-3 text-sm font-medium text-slate">
                Signed in as <span className="text-ink">{user.email}</span>
              </p>
            )}
          </div>
          <div className="rounded-[24px] bg-white/80 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Saved products</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{hasHydrated ? items.length : "..."}</p>
            <p className="mt-1 text-sm text-slate">Ready to compare, review, or order</p>
          </div>
          <div className="rounded-[24px] bg-white/80 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Quick action</p>
            <p className="mt-2 text-sm text-slate">Move your highest-priority saved item into cart in one tap.</p>
            <div className="mt-4">
              <Button
                type="button"
                disabled={!hasHydrated || !items.length}
                onClick={() => {
                  if (!items.length) return;
                  addItem(items[0]);
                  toast.success("Top wishlist item added to cart");
                }}
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                Add top item
              </Button>
            </div>
          </div>
        </div>
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
            <div className="space-y-4">
              <EmptyState title="No saved products" description="Use the wishlist to bookmark frequently ordered spare parts." />
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/products">
                  <Button>Browse products</Button>
                </Link>
                <Link href="/brands">
                  <Button variant="secondary">Shop by brand</Button>
                </Link>
                {!user ? (
                  <Link href="/login">
                    <Button variant="ghost" className="border border-slate-200 bg-white text-ink hover:bg-accentSoft">
                      <Heart className="mr-2 h-4 w-4" />
                      Sign in to sync wishlist
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
