"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { Bell, GitCompareArrows, Heart, LogOut, Menu, Moon, Package, ShoppingBag, Sun, Truck, User2 } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useCompareStore } from "@/store/compare-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useAuthStore } from "@/store/auth-store";
import { api, authHeaders } from "@/lib/api";
import { useTheme } from "@/hooks/use-theme";
import { NavbarSearch } from "./navbar-search";

const NOTIFICATION_CACHE_KEY = "sparekart-navbar-notifications";
const NOTIFICATION_CACHE_TTL = 60_000;

export function NavbarControls() {
  const router = useRouter();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartCount = useCartStore((state) => (state.hasHydrated ? state.items.length : 0));
  const compareCount = useCompareStore((state) => (state.hasHydrated ? state.items.length : 0));
  const wishlistCount = useWishlistStore((state) => (state.hasHydrated ? state.items.length : 0));
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { hydrated: themeHydrated, isDark, toggleTheme } = useTheme();

  useEffect(() => {
    if (user?.role !== "CUSTOMER" || !token) {
      setUnreadNotifications(0);
      return;
    }

    const cachedValue = readNotificationCache();
    if (cachedValue !== null) {
      setUnreadNotifications(cachedValue);
      return;
    }

    api
      .get<{ unreadCount: number }>("/account/notifications", authHeaders(token))
      .then((response) => {
        const unreadCount = response.data.unreadCount ?? 0;
        setUnreadNotifications(unreadCount);
        writeNotificationCache(unreadCount);
      })
      .catch(() => {
        setUnreadNotifications(0);
        writeNotificationCache(0);
      });
  }, [token, user?.id, user?.role]);

  const handleLogout = async () => {
    await api.post("/auth/logout").catch(() => null);
    clearAuth();
    setMobileMenuOpen(false);
    router.replace("/");
  };

  return (
    <>
      <nav className="ml-auto flex items-center gap-1.5 text-sm lg:min-w-0">
        <button
          type="button"
          onClick={() => {
            setMobileMenuOpen(false);
            setMobileSearchOpen((current) => !current);
          }}
          className="rounded-full border border-white/10 bg-white/5 p-2.5 transition hover:bg-white/10 md:hidden"
          aria-label="Toggle search"
        >
          <SearchSuggestionIcon />
        </button>
        <Link
          href="/wishlist"
          className="relative rounded-full border border-white/10 bg-white/5 p-2.5 transition hover:bg-white/10 md:hidden"
          aria-label="Wishlist"
        >
          <Heart className="h-5 w-5" />
          <NavCountBadge count={wishlistCount} tone="accent" />
        </Link>
        <Link
          href="/cart"
          className="relative rounded-full border border-white/10 bg-white/5 p-2.5 transition hover:bg-white/10 md:hidden"
          aria-label="Cart"
        >
          <ShoppingBag className="h-5 w-5" />
          <NavCountBadge count={cartCount} tone="accent" />
        </Link>
        <Link
          href={user ? "/account" : "/login"}
          className="rounded-full border border-white/10 bg-white/5 p-2.5 transition hover:bg-white/10 md:hidden"
          aria-label={user ? "Account" : "Login"}
        >
          <User2 className="h-5 w-5" />
        </Link>
        <button
          type="button"
          onClick={() => {
            setMobileSearchOpen(false);
            setMobileMenuOpen((current) => !current);
          }}
          className="rounded-full border border-white/10 bg-white/5 p-2.5 transition hover:bg-white/10 md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden min-w-0 items-center gap-1.5 md:flex">
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
            <IconLink href="/wishlist" label="Wishlist" count={wishlistCount} tone="accent">
              <Heart className="h-4.5 w-4.5" />
            </IconLink>
            <IconLink href="/cart" label="Cart" count={cartCount} tone="accent" emphasize>
              <ShoppingBag className="h-4.5 w-4.5" />
            </IconLink>
            <IconLink href="/compare" label="Compare" count={compareCount} tone="default">
              <GitCompareArrows className="h-4.5 w-4.5" />
            </IconLink>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
            <TextLink href="/track-order" label="Track">
              <Truck className="h-4.5 w-4.5" />
            </TextLink>
            {user?.role === "CUSTOMER" ? (
              <>
                <TextLink href="/my-orders" label="Orders" compact>
                  <Package className="h-4.5 w-4.5" />
                </TextLink>
                <IconLink href="/notifications" label="Alerts" count={unreadNotifications} tone="accent">
                  <Bell className="h-4.5 w-4.5" />
                </IconLink>
              </>
            ) : null}
            <TextLink href={user ? "/account" : "/login"} label={user ? "Account" : "Login"} emphasize>
              <User2 className="h-4.5 w-4.5" />
            </TextLink>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Toggle theme"
            >
              {themeHydrated && isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
                aria-label="Logout"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            ) : null}
          </div>
        </div>
      </nav>

      {mobileSearchOpen ? (
        <div className="basis-full md:hidden">
          <div className="mt-3 rounded-[24px] border border-white/10 bg-white/5 p-3 shadow-[0_20px_40px_rgba(8,17,31,0.24)]">
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Quick product search</p>
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
          <div className="mt-3 space-y-3 rounded-[24px] border border-white/10 bg-white/5 p-3 text-white">
            <div>
              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Shopping</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <MobileNavLink href="/cart" label="Cart" onClick={() => setMobileMenuOpen(false)} count={cartCount} tone="accent">
                  <ShoppingBag className="h-5 w-5" />
                </MobileNavLink>
                <MobileNavLink href="/wishlist" label="Wishlist" onClick={() => setMobileMenuOpen(false)} count={wishlistCount} tone="accent">
                  <Heart className="h-5 w-5" />
                </MobileNavLink>
                <MobileNavLink href="/compare" label="Compare" onClick={() => setMobileMenuOpen(false)} count={compareCount} tone="default">
                  <GitCompareArrows className="h-5 w-5" />
                </MobileNavLink>
                <MobileNavLink href="/track-order" label="Track" onClick={() => setMobileMenuOpen(false)}>
                  <Truck className="h-5 w-5" />
                </MobileNavLink>
              </div>
            </div>

            <div>
              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Account</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <MobileNavLink href={user ? "/account" : "/login"} label={user ? "Account" : "Login"} onClick={() => setMobileMenuOpen(false)}>
                  <User2 className="h-5 w-5" />
                </MobileNavLink>
                {user?.role === "CUSTOMER" ? (
                  <>
                    <MobileNavLink href="/my-orders" label="Orders" onClick={() => setMobileMenuOpen(false)}>
                      <Package className="h-5 w-5" />
                    </MobileNavLink>
                    <MobileNavLink href="/notifications" label="Alerts" onClick={() => setMobileMenuOpen(false)} count={unreadNotifications} tone="accent">
                      <Bell className="h-5 w-5" />
                    </MobileNavLink>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    toggleTheme();
                    setMobileMenuOpen(false);
                  }}
                  className="flex min-h-[78px] flex-col items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/5 p-3 text-xs font-semibold transition hover:bg-white/10"
                >
                  {themeHydrated && isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  <span>Theme</span>
                </button>
              </div>
            </div>

            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function IconLink({
  href,
  label,
  count,
  tone,
  emphasize,
  children
}: {
  href: string;
  label: string;
  count?: number;
  tone: "accent" | "default";
  emphasize?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-white/80 transition hover:bg-white/10 hover:text-white ${
        emphasize ? "bg-white text-ink hover:bg-white/90 hover:text-ink" : ""
      }`}
      aria-label={label}
    >
      {children}
      <span className="hidden xl:inline text-sm font-semibold">{label}</span>
      <NavCountBadge count={count} tone={tone} />
    </Link>
  );
}

function TextLink({
  href,
  label,
  children,
  compact,
  emphasize
}: {
  href: string;
  label: string;
  children: ReactNode;
  compact?: boolean;
  emphasize?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-semibold transition ${
        emphasize
          ? "bg-white text-ink hover:bg-white/90"
          : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
      <span className={compact ? "hidden 2xl:inline" : "hidden xl:inline"}>{label}</span>
    </Link>
  );
}

function MobileNavLink({
  href,
  label,
  onClick,
  count,
  tone,
  children
}: {
  href: string;
  label: string;
  onClick: () => void;
  count?: number;
  tone?: "accent" | "default";
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="relative flex min-h-[78px] flex-col items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/5 p-3 text-xs font-semibold transition hover:bg-white/10"
    >
      {children}
      <span>{label}</span>
      <NavCountBadge count={count} tone={tone ?? "default"} mobile />
    </Link>
  );
}

function NavCountBadge({
  count,
  tone,
  mobile
}: {
  count?: number;
  tone: "accent" | "default";
  mobile?: boolean;
}) {
  if (!count) {
    return null;
  }

  return (
    <span
      className={`absolute rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
        mobile ? "right-2 top-2" : "-right-1 -top-1"
      } ${tone === "accent" ? "bg-accent text-white" : "bg-white text-ink"}`}
    >
      {count}
    </span>
  );
}

function SearchSuggestionIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]"><circle cx="11" cy="11" r="6" /><path d="m20 20-3.5-3.5" /></svg>;
}

function readNotificationCache() {
  if (typeof window === "undefined") {
    return null;
  }

  const cachedRaw = window.sessionStorage.getItem(NOTIFICATION_CACHE_KEY);
  if (!cachedRaw) {
    return null;
  }

  try {
    const cached = JSON.parse(cachedRaw) as { count: number; expiresAt: number };
    if (cached.expiresAt < Date.now()) {
      window.sessionStorage.removeItem(NOTIFICATION_CACHE_KEY);
      return null;
    }

    return cached.count;
  } catch {
    window.sessionStorage.removeItem(NOTIFICATION_CACHE_KEY);
    return null;
  }
}

function writeNotificationCache(count: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    NOTIFICATION_CACHE_KEY,
    JSON.stringify({
      count,
      expiresAt: Date.now() + NOTIFICATION_CACHE_TTL
    })
  );
}
