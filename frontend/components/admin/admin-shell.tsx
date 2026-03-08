"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { api } from "@/lib/api";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/brands", label: "Brands" },
  { href: "/admin/models", label: "Models" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/users", label: "Users" }
];

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.16),transparent_24%),linear-gradient(180deg,#07111f,#0b1729)] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-200/90">Control Room</p>
          <h1 className="mt-3 font-display text-2xl">SpareKart Admin</h1>
          <nav className="mt-8 space-y-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-2xl px-4 py-3 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={async () => {
              await api.post("/auth/logout").catch(() => null);
              clearAuth();
              router.replace("/admin/login");
            }}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </aside>
        <section className="space-y-6">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-200/80">Operations</p>
            <h2 className="mt-2 font-display text-4xl">{title}</h2>
          </header>
          {children}
        </section>
      </div>
    </div>
  );
}
