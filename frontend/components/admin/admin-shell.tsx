import Link from "next/link";
import { ReactNode } from "react";

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
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-[30px] border border-white/10 bg-white/5 p-6">
          <h1 className="font-display text-2xl">SpareKart Admin</h1>
          <nav className="mt-8 space-y-2">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="block rounded-2xl px-4 py-3 text-sm text-white/80 hover:bg-white/10">
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <section className="space-y-6">
          <header>
            <h2 className="font-display text-4xl">{title}</h2>
          </header>
          {children}
        </section>
      </div>
    </div>
  );
}
