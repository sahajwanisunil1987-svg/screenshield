"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { api, authHeaders } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

export default function AdminDashboardPage() {
  const token = useAuthStore((state) => state.token);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    api.get("/admin/dashboard", authHeaders(token)).then((response) => setData(response.data));
  }, [token]);

  return (
    <AdminGuard>
      <AdminShell title="Dashboard">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Total Orders", data?.stats?.totalOrders ?? 0],
            ["Revenue", data?.stats?.totalRevenue ?? 0],
            ["Products", data?.stats?.totalProducts ?? 0],
            ["Low Stock", data?.stats?.lowStockCount ?? 0]
          ].map(([label, value]) => (
            <div key={label} className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-white/60">{label}</p>
              <p className="mt-3 font-display text-4xl">{value}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <h3 className="font-semibold">Recent orders</h3>
            <div className="mt-4 space-y-3 text-sm">
              {data?.recentOrders?.map((order: any) => (
                <div key={order.id} className="flex justify-between text-white/80">
                  <span>{order.orderNumber}</span>
                  <span>{order.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <h3 className="font-semibold">Top sellers</h3>
            <div className="mt-4 space-y-3 text-sm">
              {data?.topProducts?.map((product: any) => (
                <div key={product.productId} className="flex justify-between text-white/80">
                  <span>{product.productName}</span>
                  <span>{product._sum.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
