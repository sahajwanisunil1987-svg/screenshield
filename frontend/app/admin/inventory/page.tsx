"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { api, authHeaders } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

export default function AdminInventoryPage() {
  const token = useAuthStore((state) => state.token);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    api.get("/admin/inventory", authHeaders(token)).then((response) => setItems(response.data));
  }, [token]);

  return (
    <AdminGuard>
      <AdminShell title="Inventory">
        <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-6">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between border-b border-white/10 pb-4 text-sm">
              <span>{item.product.name}</span>
              <span className={item.stock <= item.lowStockLimit ? "text-amber-300" : "text-white"}>{item.stock}</span>
            </div>
          ))}
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
