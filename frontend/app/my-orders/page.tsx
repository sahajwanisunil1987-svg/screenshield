"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
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
    api
      .get("/orders/my-orders", authHeaders(token))
      .then((response) => setOrders(response.data))
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load your orders"));
      });
  }, [token]);

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl text-ink">My orders</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate">
          Review placed orders, payment status, included items, and jump straight into tracking for any active shipment.
        </p>
        <div className="mt-10 space-y-4">
          {orders.length ? (
            orders.map((order) => (
              <div key={order.id} className="space-y-5 rounded-[28px] bg-white p-6 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{order.orderNumber}</p>
                    <p className="text-sm text-slate">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-ink">{formatCurrency(order.totalAmount)}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                      <span className="rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                        {order.status}
                      </span>
                      <span className="rounded-full bg-[#f5f8fb] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate">
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-[#f5f8fb] p-4">
                      <p className="font-medium text-ink">{item.productName}</p>
                      <p className="mt-1 text-sm text-slate">SKU {item.productSku}</p>
                      <p className="mt-1 text-sm text-slate">Qty {item.quantity}</p>
                      <p className="mt-2 text-sm font-semibold text-ink">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>Payment: {order.paymentStatus}</span>
                    <span>Items: {order.items.length}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <Link href={`/track-order?orderNumber=${order.orderNumber}`} className="font-semibold text-accent underline">
                      Track order
                    </Link>
                    <Link href={`/order-success?orderNumber=${order.orderNumber}`} className="font-semibold text-slate underline">
                      View confirmation
                    </Link>
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
