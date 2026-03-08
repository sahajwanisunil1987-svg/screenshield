"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { PaginatedResponse, User } from "@/types";

export default function AdminUsersPage() {
  const token = useAuthStore((state) => state.token);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [query, setQuery] = useState("");
  const [activityFilter, setActivityFilter] = useState<"ALL" | "WITH_ORDERS" | "WITHOUT_ORDERS">("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    const config = authHeaders(token);
    api
      .get<PaginatedResponse<User>>("/admin/users", {
        ...config,
        params: {
          search: query || undefined,
          activity: activityFilter,
          page,
          limit: 12
        }
      })
      .then((response) => {
        setUsers(response.data.items);
        setPagination(response.data.pagination);
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load users"));
      });
  }, [activityFilter, page, query, token]);

  useEffect(() => {
    setPage(1);
  }, [activityFilter, query]);

  const pageNumbers = useMemo(
    () =>
      Array.from({ length: pagination.pages }, (_, index) => index + 1).filter((entry) =>
        entry === 1 || entry === pagination.pages || Math.abs(entry - pagination.page) <= 1
      ),
    [pagination.page, pagination.pages]
  );

  return (
    <AdminGuard>
      <AdminShell title="Users">
        <div className="mb-4 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div>
            <p className="text-sm font-semibold text-white">Customer controls</p>
            <p className="text-sm text-white/60">
              {pagination.total} users found · page {pagination.page} of {pagination.pages}
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
          {users.map((user) => (
            <div key={user.id} className="space-y-4 border-b border-white/10 pb-5 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-white/60">{user.email}</p>
                  <p className="mt-1 text-white/40">{user.phone ?? "No phone added"}</p>
                </div>
                <span>{user._count?.orders ?? user.orders?.length ?? 0} orders</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {user.orders?.map((order) => (
                  <div key={order.id} className="rounded-2xl bg-white/5 p-4">
                    <p className="font-medium text-white">{order.orderNumber}</p>
                    <p className="mt-1 text-white/60">{formatDate(order.createdAt)}</p>
                    <p className="mt-1 text-white/60">{order.status} · {order.paymentStatus}</p>
                  </div>
                ))}
              </div>
              {!user.orders?.length ? (
                <p className="text-white/40">No orders yet</p>
              ) : null}
            </div>
          ))}
          {!users.length ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center text-sm text-white/55">
              No customers match the current search and filters.
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
      </AdminShell>
    </AdminGuard>
  );
}
