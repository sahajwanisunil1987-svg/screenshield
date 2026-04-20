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
  { href: "/admin/purchases", label: "Purchases" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/brands", label: "Brands" },
  { href: "/admin/models", label: "Models" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/sponsors", label: "Sponsors" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/settings", label: "Settings" }
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
          : "bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.08),transparent_20%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.08),transparent_16%),linear-gradient(180deg,#f7fafc,#e9f0f6)] text-ink"
      }`}
    >
      <div className={`border-b backdrop-blur lg:hidden ${isDark ? "border-white/10 bg-white/5" : "border-slate-200/80 bg-white/85"}`}>
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.3em] ${isDark ? "text-teal-200/90" : "text-accent/80"}`}>Control Room</p>
              <h1 className="mt-1 font-display text-xl">PurjiX Admin</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                  isDark
                    ? "border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                    : "border-slate-200 bg-white text-ink shadow-[0_10px_24px_rgba(11,18,32,0.08)] hover:bg-slate-50"
                }`}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? "Light" : "Dark"}
              </button>
              <button
                type="button"
                onClick={logout}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                  isDark
                    ? "border-white/10 bg-white/5 text-white/85 hover:bg-white/10 hover:text-white"
                    : "border-slate-200 bg-white text-ink shadow-[0_10px_24px_rgba(11,18,32,0.08)] hover:bg-slate-50"
                }`}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
          <p className={`mt-3 text-xs font-semibold uppercase tracking-[0.24em] ${isDark ? "text-teal-200/80" : "text-accent/75"}`}>{title}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {mobileLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-2xl px-3 py-2 text-center text-[13px] font-semibold transition ${
                    isActive
                      ? isDark
                        ? "bg-white text-ink"
                        : "bg-ink text-white shadow-[0_12px_28px_rgba(11,18,32,0.14)]"
                      : isDark
                        ? "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                        : "border border-slate-200 bg-white/80 text-slate hover:bg-white"
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
        <aside
          className={`hidden rounded-[30px] border p-6 backdrop-blur lg:block ${
            isDark
              ? "border-white/10 bg-white/5 shadow-[0_24px_70px_rgba(0,0,0,0.28)]"
              : "border-slate-200/80 bg-white/88 shadow-[0_28px_70px_rgba(11,18,32,0.12)]"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${isDark ? "text-teal-200/90" : "text-accent/80"}`}>Control Room</p>
              <h1 className="mt-3 font-display text-2xl">PurjiX Admin</h1>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                isDark
                  ? "border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                  : "border-slate-200 bg-white text-ink shadow-[0_10px_24px_rgba(11,18,32,0.08)] hover:bg-slate-50"
              }`}
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
                    isActive
                      ? isDark
                        ? "bg-white text-ink"
                        : "bg-slate-100 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                      : isDark
                        ? "text-white/80 hover:bg-white/10 hover:text-white"
                        : "text-slate hover:bg-slate-50 hover:text-ink"
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
            className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
              isDark
                ? "border-white/10 bg-white/5 text-white/85 hover:bg-white/10 hover:text-white"
                : "border-slate-200 bg-white text-ink shadow-[0_12px_28px_rgba(11,18,32,0.08)] hover:bg-slate-50"
            }`}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </aside>
        <section className="space-y-6">
          <header className="hidden lg:block">
            <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${isDark ? "text-teal-200/80" : "text-accent/75"}`}>Operations</p>
            <h2 className="mt-2 font-display text-4xl">{title}</h2>
          </header>
          {children}
        </section>
      </div>
    </div>
  );
}
