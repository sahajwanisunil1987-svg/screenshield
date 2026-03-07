"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { ProductListResponse } from "@/types";

export default function AdminProductsPage() {
  const [data, setData] = useState<ProductListResponse | null>(null);

  useEffect(() => {
    api.get("/products?limit=50").then((response) => setData(response.data));
  }, []);

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
            {data?.items.map((product) => (
              <div key={product.id} className="flex items-center justify-between border-b border-white/10 pb-4 text-sm">
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-white/60">{product.sku}</p>
                </div>
                <Link href={`/admin/products/edit/${product.id}`} className="text-accent">
                  Edit
                </Link>
              </div>
            ))}
          </div>
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
