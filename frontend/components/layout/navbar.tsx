"use client";

import Link from "next/link";
import { Heart, Search, ShoppingBag, Truck } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useAuthStore } from "@/store/auth-store";

export function Navbar() {
  const items = useCartStore((state) => state.items);
  const wishlist = useWishlistStore((state) => state.items);
  const user = useAuthStore((state) => state.user);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 text-white sm:px-6 lg:px-8">
        <Link href="/" className="font-display text-2xl tracking-tight">
          SpareKart
        </Link>
        <div className="hidden flex-1 items-center rounded-full border border-white/10 bg-white/5 px-4 py-3 md:flex">
          <Search className="h-4 w-4 text-white/70" />
          <span className="ml-3 text-sm text-white/60">Search by brand, model, part, or SKU</span>
        </div>
        <nav className="ml-auto flex items-center gap-3 text-sm">
          <Link href="/track-order" className="hidden items-center gap-2 rounded-full px-4 py-2 hover:bg-white/10 sm:flex">
            <Truck className="h-4 w-4" />
            Track
          </Link>
          <Link href={user ? "/my-orders" : "/login"} className="rounded-full px-4 py-2 hover:bg-white/10">
            {user ? user.name.split(" ")[0] : "Login"}
          </Link>
          <Link href="/wishlist" className="relative rounded-full p-2 hover:bg-white/10">
            <Heart className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 rounded-full bg-ember px-1.5 text-[10px]">
              {wishlist.length}
            </span>
          </Link>
          <Link href="/cart" className="relative rounded-full p-2 hover:bg-white/10">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1.5 text-[10px]">
              {items.length}
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
