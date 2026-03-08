"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { PaginatedResponse, Product } from "@/types";

export default function AdminProductsPage() {
  const token = useAuthStore((state) => state.token);
  const [data, setData] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [featureFilter, setFeatureFilter] = useState<"ALL" | "FEATURED" | "STANDARD">("ALL");
  const [page, setPage] = useState(1);

  const load = () => {
    if (!token) return;
    const config = authHeaders(token);
    api
      .get<PaginatedResponse<Product>>("/admin/products", {
        ...config,
        params: {
          search: query || undefined,
          status: statusFilter,
          feature: featureFilter,
          page,
          limit: 12
        }
      })
      .then((response) => {
        setData(response.data.items);
        setPagination(response.data.pagination);
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load products"));
      });
  };

  useEffect(() => {
    load();
  }, [featureFilter, page, query, statusFilter, token]);

  useEffect(() => {
    setPage(1);
  }, [featureFilter, query, statusFilter]);

  const pageNumbers = useMemo(
    () =>
      Array.from({ length: pagination.pages }, (_, index) => index + 1).filter((entry) =>
        entry === 1 || entry === pagination.pages || Math.abs(entry - pagination.page) <= 1
      ),
    [pagination.page, pagination.pages]
  );

  return (
    <AdminGuard>
      <AdminShell title="Products">
        <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Catalog controls</p>
              <p className="text-sm text-white/60">
                {pagination.total} products found · page {pagination.page} of {pagination.pages}
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
            {data.map((product) => (
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
            {!data.length ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center text-sm text-white/55">
                No products match the current search and filters.
              </div>
            ) : null}
            {pagination.pages > 1 ? (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  disabled={pagination.page === 1}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:text-white/30 hover:bg-white/10"
                >
                  Previous
                </button>
                {pageNumbers.map((entry, index) => {
                  const previousPage = pageNumbers[index - 1];
                  const showGap = previousPage && entry - previousPage > 1;

                  return (
                    <div key={entry} className="flex items-center gap-3">
                      {showGap ? <span className="text-white/40">…</span> : null}
                      <button
                        type="button"
                        onClick={() => setPage(entry)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          entry === pagination.page ? "bg-accent text-white" : "border border-white/10 text-white hover:bg-white/10"
                        }`}
                      >
                        {entry}
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(current + 1, pagination.pages))}
                  disabled={pagination.page === pagination.pages}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:text-white/30 hover:bg-white/10"
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
