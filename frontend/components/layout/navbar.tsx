"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GitCompareArrows, Heart, LogOut, ShoppingBag, Truck, User2 } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useCompareStore } from "@/store/compare-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useAuthStore } from "@/store/auth-store";
import { api } from "@/lib/api";
import { SearchSuggestion } from "@/types";
import { SearchAutocomplete } from "@/components/ui/search-autocomplete";

export function Navbar() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const items = useCartStore((state) => state.items);
  const cartHydrated = useCartStore((state) => state.hasHydrated);
  const compareItems = useCompareStore((state) => state.items);
  const compareHydrated = useCompareStore((state) => state.hasHydrated);
  const wishlist = useWishlistStore((state) => state.items);
  const wishlistHydrated = useWishlistStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const cartCount = cartHydrated ? items.length : 0;
  const compareCount = compareHydrated ? compareItems.length : 0;
  const wishlistCount = wishlistHydrated ? wishlist.length : 0;

  const onSearch = () => {
    const params = new URLSearchParams();
    if (search.trim()) {
      params.set("search", search.trim());
    }

    router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/90 shadow-[0_18px_40px_rgba(8,17,31,0.18)] backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-4 text-white sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
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
            <button
              type="button"
              onClick={() => setMobileSearchOpen((current) => !current)}
              className="rounded-full p-2 hover:bg-white/10 md:hidden"
              aria-label="Toggle search"
            >
              <SearchSuggestionIcon />
            </button>
            <Link href="/track-order" className="hidden items-center gap-2 rounded-full px-4 py-2 hover:bg-white/10 sm:flex">
              <Truck className="h-4 w-4" />
              Track
            </Link>
            {user?.role === "CUSTOMER" ? (
              <>
                <Link href="/my-orders" className="hidden rounded-full px-4 py-2 hover:bg-white/10 lg:flex">
                  My Orders
                </Link>
                <Link href="/notifications" className="hidden rounded-full px-4 py-2 hover:bg-white/10 lg:flex">
                  Notifications
                </Link>
              </>
            ) : null}
            {user?.role === "ADMIN" ? (
              <Link href="/admin/orders" className="hidden rounded-full px-4 py-2 hover:bg-white/10 lg:flex">
                Admin
              </Link>
            ) : null}
            <Link href={user ? "/account" : "/login"} className="rounded-full px-4 py-2 hover:bg-white/10">
              {user ? "Account" : "Login"}
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
                {wishlistCount}
              </span>
            </Link>
            <Link href="/compare" className="relative rounded-full p-2 hover:bg-white/10">
              <GitCompareArrows className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 rounded-full bg-white px-1.5 text-[10px] text-ink">
                {compareCount}
              </span>
            </Link>
            <Link href="/cart" className="relative rounded-full p-2 hover:bg-white/10">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1.5 text-[10px]">
                {cartCount}
              </span>
            </Link>
          </nav>
        </div>
        {mobileSearchOpen ? (
          <form
            className="mt-4 flex items-center gap-3 md:hidden"
            onSubmit={(event) => {
              event.preventDefault();
              onSearch();
              setMobileSearchOpen(false);
            }}
          >
            <div className="flex-1">
              <SearchAutocomplete
                value={search}
                onChange={setSearch}
                onSubmit={() => {
                  onSearch();
                  setMobileSearchOpen(false);
                }}
                onSuggestionSelect={(suggestion: SearchSuggestion) => {
                  setMobileSearchOpen(false);
                  router.push(`/products/${suggestion.slug}`);
                }}
                placeholder="Search parts or SKU"
                inputClassName="border-white/10 bg-white/5 text-white placeholder:text-white/45 focus:border-white/20 focus:ring-white/10"
                dropdownClassName="bg-white"
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent/90"
            >
              Go
            </button>
          </form>
        ) : null}
        <div className="mt-4 grid grid-cols-5 gap-2 md:hidden">
          <Link
            href={user ? "/account" : "/login"}
            className="flex flex-col items-center justify-center rounded-[20px] border border-white/10 bg-white/5 px-3 py-3 text-[11px] font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            <User2 className="h-4 w-4" />
            <span className="mt-2">Account</span>
          </Link>
          <Link
            href="/track-order"
            className="flex flex-col items-center justify-center rounded-[20px] border border-white/10 bg-white/5 px-3 py-3 text-[11px] font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            <Truck className="h-4 w-4" />
            <span className="mt-2">Track</span>
          </Link>
          <Link
            href="/wishlist"
            className="relative flex flex-col items-center justify-center rounded-[20px] border border-white/10 bg-white/5 px-3 py-3 text-[11px] font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            <Heart className="h-4 w-4" />
            <span className="mt-2">Wishlist</span>
            <span className="absolute right-2 top-2 rounded-full bg-ember px-1.5 text-[10px] text-white">
              {wishlistCount}
            </span>
          </Link>
          <Link
            href="/compare"
            className="relative flex flex-col items-center justify-center rounded-[20px] border border-white/10 bg-white/5 px-3 py-3 text-[11px] font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            <GitCompareArrows className="h-4 w-4" />
            <span className="mt-2">Compare</span>
            <span className="absolute right-2 top-2 rounded-full bg-white px-1.5 text-[10px] text-ink">
              {compareCount}
            </span>
          </Link>
          <Link
            href="/cart"
            className="relative flex flex-col items-center justify-center rounded-[20px] border border-white/10 bg-white/5 px-3 py-3 text-[11px] font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="mt-2">Cart</span>
            <span className="absolute right-2 top-2 rounded-full bg-accent px-1.5 text-[10px] text-white">
              {cartCount}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function SearchSuggestionIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]"><circle cx="11" cy="11" r="6" /><path d="m20 20-3.5-3.5" /></svg>;
}
