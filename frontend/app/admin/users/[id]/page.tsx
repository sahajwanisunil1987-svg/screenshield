"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { AdminUserDetail } from "@/types";

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const token = useAuthStore((state) => state.token);
  const [user, setUser] = useState<AdminUserDetail | null>(null);

  useEffect(() => {
    if (!token || !params?.id) return;

    api
      .get<AdminUserDetail>(`/admin/users/${params.id}`, authHeaders(token))
      .then((response) => setUser(response.data))
      .catch((error) => toast.error(getApiErrorMessage(error, "Unable to load customer details")));
  }, [params?.id, token]);

  return (
    <AdminGuard>
      <AdminShell title="Customer detail">
        {user ? (
          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Customer profile</p>
                  <h2 className="mt-2 text-3xl font-display text-white">{user.name}</h2>
                  <p className="mt-2 text-sm text-white/65">{user.email}</p>
                  <p className="mt-1 text-sm text-white/45">{user.phone ?? "No phone added"}</p>
                </div>
                <Link href="/admin/users" className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                  Back to users
                </Link>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[24px] bg-black/10 p-4"><p className="text-xs uppercase tracking-[0.18em] text-white/45">Total orders</p><p className="mt-3 text-3xl font-display text-cyan-200">{user.stats.totalOrders}</p></div>
                <div className="rounded-[24px] bg-black/10 p-4"><p className="text-xs uppercase tracking-[0.18em] text-white/45">Total spend</p><p className="mt-3 text-3xl font-display text-emerald-200">{formatCurrency(user.stats.totalSpent)}</p></div>
                <div className="rounded-[24px] bg-black/10 p-4"><p className="text-xs uppercase tracking-[0.18em] text-white/45">AOV</p><p className="mt-3 text-3xl font-display text-amber-200">{formatCurrency(user.stats.averageOrderValue)}</p></div>
                <div className="rounded-[24px] bg-black/10 p-4"><p className="text-xs uppercase tracking-[0.18em] text-white/45">Addresses</p><p className="mt-3 text-3xl font-display text-fuchsia-200">{user.stats.totalAddresses}</p><p className="mt-2 text-xs text-white/45">{user.stats.lastOrderAt ? `Last order ${formatDate(user.stats.lastOrderAt)}` : "No orders yet"}</p></div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-white">Saved addresses</h3>
                  <span className="text-xs uppercase tracking-[0.18em] text-white/45">{user.addresses.length} entries</span>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  {user.addresses.length ? user.addresses.map((address) => (
                    <div key={address.id} className="rounded-[22px] border border-white/10 bg-black/10 p-4 text-white/80">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{address.fullName}</p>
                          <p className="mt-1 text-white/55">{[address.line1, address.line2, address.landmark, address.city, address.state, address.postalCode].filter(Boolean).join(", ")}</p>
                          <p className="mt-2 text-white/45">{address.phone}</p>
                          {address.gstNumber ? <p className="mt-1 text-white/45">GST {address.gstNumber}</p> : null}
                        </div>
                        {address.isDefault ? <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">Default</span> : null}
                      </div>
                    </div>
                  )) : <p className="rounded-[22px] border border-dashed border-white/10 bg-black/10 px-4 py-8 text-center text-white/50">No saved addresses available.</p>}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-white">Recent orders</h3>
                  <span className="text-xs uppercase tracking-[0.18em] text-white/45">Latest 8</span>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  {user.orders.length ? user.orders.map((order) => (
                    <div key={order.id} className="rounded-[22px] border border-white/10 bg-black/10 p-4 text-white/80">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{order.orderNumber}</p>
                          <p className="mt-1 text-white/50">{formatDateTime(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white">{formatCurrency(order.totalAmount ?? 0)}</p>
                          <p className="mt-1 text-xs text-white/45">{order.status} · {order.paymentStatus}</p>
                        </div>
                      </div>
                      {order.items?.length ? (
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="rounded-2xl bg-white/5 px-3 py-2">
                              <p className="font-medium text-white">{item.productName}</p>
                              <p className="mt-1 text-xs text-white/45">SKU {item.productSku} · Qty {item.quantity}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )) : <p className="rounded-[22px] border border-dashed border-white/10 bg-black/10 px-4 py-8 text-center text-white/50">No orders placed yet.</p>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-sm text-white/60">Loading customer details...</div>
        )}
      </AdminShell>
    </AdminGuard>
  );
}
