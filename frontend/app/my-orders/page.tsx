"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { api, authHeaders } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useAuthStore } from "@/store/auth-store";
import { Order } from "@/types";

export default function MyOrdersPage() {
  useAuthGuard("CUSTOMER");
  const token = useAuthStore((state) => state.token);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!token) return;
    api.get("/orders/my-orders", authHeaders(token)).then((response) => setOrders(response.data));
  }, [token]);

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl text-ink">My orders</h1>
        <div className="mt-10 space-y-4">
          {orders.length ? (
            orders.map((order) => (
              <div key={order.id} className="rounded-[28px] bg-white p-6 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{order.orderNumber}</p>
                    <p className="text-sm text-slate">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-ink">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-sm text-accent">{order.status}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState title="No orders yet" description="Your confirmed SpareKart purchases will show up here." />
          )}
        </div>
      </div>
    </PageShell>
  );
}
