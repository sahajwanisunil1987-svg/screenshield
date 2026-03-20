"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, GitCompareArrows, Heart, LogOut, Menu, Moon, Package, ShoppingBag, Sun, Truck, User2 } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useCompareStore } from "@/store/compare-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useAuthStore } from "@/store/auth-store";
import { api, authHeaders } from "@/lib/api";
import { useTheme } from "@/hooks/use-theme";
import { NavbarSearch } from "./navbar-search";

export function NavbarControls() {
  const router = useRouter();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const items = useCartStore((state) => state.items);
  const cartHydrated = useCartStore((state) => state.hasHydrated);
  const compareItems = useCompareStore((state) => state.items);
  const compareHydrated = useCompareStore((state) => state.hasHydrated);
  const wishlist = useWishlistStore((state) => state.items);
  const wishlistHydrated = useWishlistStore((state) => state.hasHydrated);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const cartCount = cartHydrated ? items.length : 0;
  const compareCount = compareHydrated ? compareItems.length : 0;
  const wishlistCount = wishlistHydrated ? wishlist.length : 0;
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { hydrated: themeHydrated, isDark, toggleTheme } = useTheme();

  useEffect(() => {
    if (user?.role !== "CUSTOMER" || !token) {
      setUnreadNotifications(0);
      return;
    }

    api
      .get<{ unreadCount: number }>("/account/notifications", authHeaders(token))
      .then((response) => setUnreadNotifications(response.data.unreadCount ?? 0))
      .catch(() => setUnreadNotifications(0));
  }, [token, user?.id, user?.role]);

  return (
    <>
      <nav className="ml-auto flex items-center gap-1 text-sm sm:gap-3">
        <button
          type="button"
          onClick={() => setMobileSearchOpen((current) => !current)}
          className="rounded-full p-2 hover:bg-white/10 md:hidden"
          aria-label="Toggle search"
        >
          <SearchSuggestionIcon />
        </button>
        <Link href="/track-order" className="inline-flex items-center gap-2 rounded-full p-2 hover:bg-white/10 sm:px-4 sm:py-2">
          <Truck className="h-5 w-5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Track</span>
        </Link>
        <Link href="/wishlist" className="relative rounded-full p-2 hover:bg-white/10">
          <Heart className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 rounded-full bg-ember px-1.5 text-[10px]">
            {wishlistCount}
          </span>
        </Link>
        <Link href="/cart" className="relative rounded-full p-2 hover:bg-white/10">
          <ShoppingBag className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1.5 text-[10px]">
            {cartCount}
          </span>
        </Link>
        <Link href={user ? "/account" : "/login"} className="inline-flex items-center gap-2 rounded-full p-2 hover:bg-white/10 sm:px-4 sm:py-2">
          <User2 className="h-5 w-5 sm:hidden" />
          <span className="hidden sm:inline">{user ? "Account" : "Login"}</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((current) => !current)}
          className="rounded-full p-2 hover:bg-white/10 md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden items-center gap-1 sm:flex sm:gap-3">
          {user?.role === "CUSTOMER" ? (
            <>
              <Link href="/my-orders" className="inline-flex items-center gap-2 rounded-full p-2 hover:bg-white/10 lg:px-4 lg:py-2">
                <Package className="h-5 w-5 lg:hidden" />
                <span className="hidden lg:inline">My Orders</span>
              </Link>
              <Link href="/notifications" className="relative inline-flex items-center gap-2 rounded-full p-2 hover:bg-white/10 lg:px-4 lg:py-2">
                <Bell className="h-5 w-5 lg:hidden" />
                <span className="hidden lg:inline">Notifications</span>
                {unreadNotifications > 0 ? <span className="absolute -right-1 -top-1 rounded-full bg-ember px-1.5 text-[10px] text-white">{unreadNotifications}</span> : null}
              </Link>
            </>
          ) : null}
          <Link href="/compare" className="relative rounded-full p-2 hover:bg-white/10">
            <GitCompareArrows className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 rounded-full bg-white px-1.5 text-[10px] text-ink">
              {compareCount}
            </span>
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
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full p-2 hover:bg-white/10"
            aria-label="Toggle theme"
          >
            {themeHydrated && isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </nav>
      {mobileSearchOpen ? (
        <div className="basis-full md:hidden">
          <div className="mt-4">
            <NavbarSearch
              placeholder="Search parts or SKU"
              buttonLabel="Go"
              onSubmitted={() => setMobileSearchOpen(false)}
              wrapperClassName="flex items-center gap-3"
              inputClassName="border-white/10 bg-white/5 text-white placeholder:text-white/45 focus:border-white/20 focus:ring-white/10"
              dropdownClassName="theme-surface"
              buttonClassName="rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent/90"
            />
          </div>
        </div>
      ) : null}
      {mobileMenuOpen ? (
        <div className="basis-full md:hidden">
          <div className="mt-3 grid grid-cols-4 gap-2 rounded-[24px] border border-white/10 bg-white/5 p-3 text-white">
            {user?.role === "CUSTOMER" ? (
              <>
                <Link href="/my-orders" onClick={() => setMobileMenuOpen(false)} className="flex flex-col items-center gap-2 rounded-2xl p-3 text-xs font-semibold hover:bg-white/10">
                  <Package className="h-5 w-5" />
                  <span>Orders</span>
                </Link>
                <Link href="/notifications" onClick={() => setMobileMenuOpen(false)} className="relative flex flex-col items-center gap-2 rounded-2xl p-3 text-xs font-semibold hover:bg-white/10">
                  <Bell className="h-5 w-5" />
                  <span>Alerts</span>
                  {unreadNotifications > 0 ? <span className="absolute right-2 top-2 rounded-full bg-ember px-1.5 text-[10px] text-white">{unreadNotifications}</span> : null}
                </Link>
              </>
            ) : null}
            <Link href="/compare" onClick={() => setMobileMenuOpen(false)} className="relative flex flex-col items-center gap-2 rounded-2xl p-3 text-xs font-semibold hover:bg-white/10">
              <GitCompareArrows className="h-5 w-5" />
              <span>Compare</span>
              <span className="absolute right-2 top-2 rounded-full bg-white px-1.5 text-[10px] text-ink">{compareCount}</span>
            </Link>
            <button type="button" onClick={() => { toggleTheme(); setMobileMenuOpen(false); }} className="flex flex-col items-center gap-2 rounded-2xl p-3 text-xs font-semibold hover:bg-white/10">
              {themeHydrated && isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span>Theme</span>
            </button>
            {user ? (
              <button
                type="button"
                onClick={async () => {
                  await api.post("/auth/logout").catch(() => null);
                  clearAuth();
                  setMobileMenuOpen(false);
                  router.replace("/");
                }}
                className="flex flex-col items-center gap-2 rounded-2xl p-3 text-xs font-semibold hover:bg-white/10"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function SearchSuggestionIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]"><circle cx="11" cy="11" r="6" /><path d="m20 20-3.5-3.5" /></svg>;
}
