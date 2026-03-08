"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, LogOut, ShoppingBag, Truck } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useAuthStore } from "@/store/auth-store";
import { api } from "@/lib/api";
import { SearchSuggestion } from "@/types";
import { SearchAutocomplete } from "@/components/ui/search-autocomplete";

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
          <div className="flex-1">
            <SearchAutocomplete
              value={search}
              onChange={setSearch}
              onSubmit={() => onSearch()}
              onSuggestionSelect={(suggestion: SearchSuggestion) => router.push(`/products/${suggestion.slug}`)}
              placeholder="Search by brand, model, part, or SKU"
              inputClassName="border-white/10 bg-white/5 text-white placeholder:text-white/45 focus:border-white/20 focus:ring-white/10"
              dropdownClassName="bg-white"
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
