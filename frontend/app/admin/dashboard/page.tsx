"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

export default function AdminDashboardPage() {
  const token = useAuthStore((state) => state.token);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    api
      .get("/admin/dashboard", authHeaders(token))
      .then((response) => setData(response.data))
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load dashboard"));
      });
  }, [token]);

  return (
    <AdminGuard>
      <AdminShell title="Dashboard">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Total Orders", data?.stats?.totalOrders ?? 0],
            ["Revenue", formatCurrency(data?.stats?.totalRevenue ?? 0)],
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
                <div key={order.id} className="flex justify-between gap-3 text-white/80">
                  <div>
                    <p className="font-medium text-white">{order.orderNumber}</p>
                    <p className="text-white/50">{order.user?.name}</p>
                  </div>
                  <div className="text-right">
                    <p>{order.status}</p>
                    <p className="text-white/50">{formatCurrency(Number(order.totalAmount ?? 0))}</p>
                  </div>
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
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <h3 className="font-semibold">Low stock alerts</h3>
            <div className="mt-4 space-y-3 text-sm">
              {data?.lowStock?.length ? (
                data.lowStock.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-white/80">
                    <span>{item.product.name}</span>
                    <span className="text-amber-300">
                      {item.stock}/{item.lowStockLimit}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-white/50">No low stock alerts right now.</p>
              )}
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <h3 className="font-semibold">Recent customers</h3>
            <div className="mt-4 space-y-3 text-sm">
              {data?.users?.map((user: any) => (
                <div key={user.id} className="flex justify-between text-white/80">
                  <div>
                    <p className="font-medium text-white">{user.name}</p>
                    <p className="text-white/50">{user.email}</p>
                  </div>
                  <span className="text-white/50">
                    {new Date(user.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
