"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, LogOut, Search, ShoppingBag, Truck } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useAuthStore } from "@/store/auth-store";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export function Navbar() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const items = useCartStore((state) => state.items);
  const wishlist = useWishlistStore((state) => state.items);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const onSearch = () => {
    const params = new URLSearchParams();
    if (search.trim()) {
      params.set("search", search.trim());
    }

    router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/90 shadow-[0_18px_40px_rgba(8,17,31,0.18)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 text-white sm:px-6 lg:px-8">
        <Link href="/" className="font-display text-2xl tracking-tight">
          SpareKart
        </Link>
        <form
          className="hidden flex-1 items-center gap-3 md:flex"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch();
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by brand, model, part, or SKU"
              className="border-white/10 bg-white/5 pl-11 text-white placeholder:text-white/45 focus:border-white/20 focus:ring-white/10"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent/90"
          >
            Search
          </button>
        </form>
        <nav className="ml-auto flex items-center gap-3 text-sm">
          <Link href="/track-order" className="hidden items-center gap-2 rounded-full px-4 py-2 hover:bg-white/10 sm:flex">
            <Truck className="h-4 w-4" />
            Track
          </Link>
          <Link href={user ? "/my-orders" : "/login"} className="rounded-full px-4 py-2 hover:bg-white/10">
            {user ? user.name.split(" ")[0] : "Login"}
          </Link>
          {user ? (
            <button
              type="button"
              onClick={async () => {
                await api.post("/auth/logout").catch(() => null);
                clearAuth();
                router.replace("/");
              }}
              className="rounded-full p-2 hover:bg-white/10"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          ) : null}
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
