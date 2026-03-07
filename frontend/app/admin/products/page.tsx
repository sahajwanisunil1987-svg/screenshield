"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

  return (
    <AdminGuard>
      <AdminShell title="Products">
        <div className="flex justify-end">
          <Link href="/admin/products/new">
            <Button>New product</Button>
          </Link>
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
          </div>
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
