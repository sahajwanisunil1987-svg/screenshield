"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

export default function AdminUsersPage() {
  const token = useAuthStore((state) => state.token);
  const [users, setUsers] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [activityFilter, setActivityFilter] = useState<"ALL" | "WITH_ORDERS" | "WITHOUT_ORDERS">("ALL");

  useEffect(() => {
    if (!token) return;
    api
      .get("/admin/users", authHeaders(token))
      .then((response) => setUsers(response.data))
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load users"));
      });
  }, [token]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesQuery =
        !normalizedQuery ||
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery) ||
        (user.phone ?? "").toLowerCase().includes(normalizedQuery);

      const matchesActivity =
        activityFilter === "ALL" ||
        (activityFilter === "WITH_ORDERS" ? user.orders.length > 0 : user.orders.length === 0);

      return matchesQuery && matchesActivity;
    });
  }, [activityFilter, query, users]);

  return (
    <AdminGuard>
      <AdminShell title="Users">
        <div className="mb-4 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div>
            <p className="text-sm font-semibold text-white">Customer controls</p>
            <p className="text-sm text-white/60">
              {filteredUsers.length} of {users.length} users visible
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1.5fr_minmax(0,220px)]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, email, or phone"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40"
            />
            <select
              value={activityFilter}
              onChange={(event) => setActivityFilter(event.target.value as "ALL" | "WITH_ORDERS" | "WITHOUT_ORDERS")}
              className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink"
            >
              <option value="ALL">All customers</option>
              <option value="WITH_ORDERS">With orders</option>
              <option value="WITHOUT_ORDERS">Without orders</option>
            </select>
          </div>
        </div>
        <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-6">
          {filteredUsers.map((user) => (
            <div key={user.id} className="space-y-4 border-b border-white/10 pb-5 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-white/60">{user.email}</p>
                  <p className="mt-1 text-white/40">{user.phone ?? "No phone added"}</p>
                </div>
                <span>{user.orders.length} orders</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {user.orders.slice(0, 4).map((order: any) => (
                  <div key={order.id} className="rounded-2xl bg-white/5 p-4">
                    <p className="font-medium text-white">{order.orderNumber}</p>
                    <p className="mt-1 text-white/60">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                    <p className="mt-1 text-white/60">{order.status} · {order.paymentStatus}</p>
                  </div>
                ))}
              </div>
              {!user.orders.length ? (
                <p className="text-white/40">No orders yet</p>
              ) : null}
            </div>
          ))}
          {!filteredUsers.length ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center text-sm text-white/55">
              No customers match the current search and filters.
            </div>
          ) : null}
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
