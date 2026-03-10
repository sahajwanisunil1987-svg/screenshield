"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import { LogOut, Moon, Sun } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { api } from "@/lib/api";
import { useAdminTheme } from "@/hooks/use-admin-theme";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/accounting", label: "Accounting" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/brands", label: "Brands" },
  { href: "/admin/models", label: "Models" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/users", label: "Users" }
];

const mobileLinks = links;

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { isDark, toggleTheme, theme } = useAdminTheme();

  const logout = async () => {
    await api.post("/auth/logout").catch(() => null);
    clearAuth();
    router.replace("/admin/login");
  };

  return (
    <div
      data-admin-theme={theme}
      className={`admin-theme min-h-screen ${
        isDark
          ? "bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.16),transparent_24%),linear-gradient(180deg,#07111f,#0b1729)] text-white"
          : "bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.12),transparent_22%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_18%),linear-gradient(180deg,#f9fbfd,#edf3f8)] text-ink"
      }`}
    >
      <div className="border-b border-white/10 bg-white/5 backdrop-blur lg:hidden">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-200/90">Control Room</p>
              <h1 className="mt-1 font-display text-xl">SpareKart Admin</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? "Light" : "Dark"}
              </button>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/80">{title}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {mobileLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-2xl px-3 py-2 text-center text-[13px] font-semibold transition ${
                    isActive ? "bg-white text-ink" : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 lg:grid-cols-[260px_1fr] lg:py-8">
        <aside className="hidden rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur lg:block">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-200/90">Control Room</p>
              <h1 className="mt-3 font-display text-2xl">SpareKart Admin</h1>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDark ? "Light" : "Dark"}
            </button>
          </div>
          <nav className="mt-8 space-y-2">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-2xl px-4 py-3 text-sm transition ${
                    isActive ? "bg-white text-ink" : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={logout}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </aside>
        <section className="space-y-6">
          <header className="hidden lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-200/80">Operations</p>
            <h2 className="mt-2 font-display text-4xl">{title}</h2>
          </header>
          {children}
        </section>
      </div>
    </div>
  );
}
