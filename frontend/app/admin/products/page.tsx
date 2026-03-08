"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Product } from "@/types";

export default function AdminProductsPage() {
  const token = useAuthStore((state) => state.token);
  const [data, setData] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [featureFilter, setFeatureFilter] = useState<"ALL" | "FEATURED" | "STANDARD">("ALL");

  const load = () => {
    if (!token) return;
    api
      .get("/admin/products", authHeaders(token))
      .then((response) => setData(response.data))
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load products"));
      });
  };

  useEffect(() => {
    load();
  }, [token]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return data.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.sku.toLowerCase().includes(normalizedQuery) ||
        product.brand.name.toLowerCase().includes(normalizedQuery) ||
        product.model.name.toLowerCase().includes(normalizedQuery) ||
        product.category.name.toLowerCase().includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" ? product.isActive : !product.isActive);

      const matchesFeature =
        featureFilter === "ALL" ||
        (featureFilter === "FEATURED" ? product.isFeatured : !product.isFeatured);

      return matchesQuery && matchesStatus && matchesFeature;
    });
  }, [data, featureFilter, query, statusFilter]);

  return (
    <AdminGuard>
      <AdminShell title="Products">
        <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Catalog controls</p>
              <p className="text-sm text-white/60">
                {filteredProducts.length} of {data.length} products visible
              </p>
            </div>
            <Link href="/admin/products/new">
              <Button>New product</Button>
            </Link>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.5fr_repeat(2,minmax(0,220px))]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, SKU, brand, model, or category"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
              className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active only</option>
              <option value="INACTIVE">Inactive only</option>
            </select>
            <select
              value={featureFilter}
              onChange={(event) => setFeatureFilter(event.target.value as "ALL" | "FEATURED" | "STANDARD")}
              className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink"
            >
              <option value="ALL">All product types</option>
              <option value="FEATURED">Featured only</option>
              <option value="STANDARD">Standard only</option>
            </select>
          </div>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-4 border-b border-white/10 pb-4 text-sm">
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-white/60">
                    {product.sku} · {product.brand.name} · Stock {product.inventory?.stock ?? product.stock}
                  </p>
                  <div className="mt-2 flex gap-2 text-xs">
                    <span className="rounded-full bg-white/10 px-2 py-1">{product.isActive ? "Active" : "Inactive"}</span>
                    <span className="rounded-full bg-teal-500/20 px-2 py-1 text-teal-100">
                      {product.isFeatured ? "Featured" : "Standard"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Link href={`/admin/products/edit/${product.id}`} className="text-accent">
                    Edit
                  </Link>
                  <button
                    className="text-red-300"
                    onClick={async () => {
                      try {
                        await api.delete(`/admin/products/${product.id}`, authHeaders(token));
                        toast.success("Product deleted");
                        load();
                      } catch (error) {
                        toast.error(getApiErrorMessage(error, "Unable to delete product"));
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {!filteredProducts.length ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center text-sm text-white/55">
                No products match the current search and filters.
              </div>
            ) : null}
          </div>
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
