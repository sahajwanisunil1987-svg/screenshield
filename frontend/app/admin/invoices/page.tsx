"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { Input } from "@/components/ui/input";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { InvoiceRecord, PaginatedResponse } from "@/types";

export default function AdminInvoicesPage() {
  const token = useAuthStore((state) => state.token);
  const [items, setItems] = useState<InvoiceRecord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!token) return;

    api
      .get<PaginatedResponse<InvoiceRecord>>("/admin/invoices", {
        ...authHeaders(token),
        params: {
          search: query || undefined,
          status: statusFilter,
          page,
          limit: 12
        }
      })
      .then((response) => {
        setItems(response.data.items);
        setPagination(response.data.pagination);
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load invoices"));
      });
  }, [page, query, statusFilter, token]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

  const pageNumbers = useMemo(
    () =>
      Array.from({ length: pagination.pages }, (_, index) => index + 1).filter((entry) =>
        entry === 1 || entry === pagination.pages || Math.abs(entry - pagination.page) <= 1
      ),
    [pagination.page, pagination.pages]
  );

  return (
    <AdminGuard>
      <AdminShell title="Invoices">
        <div className="space-y-6 rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white">Invoice history</h3>
              <p className="mt-1 text-sm text-white/60">
                Track generated invoices, download activity, and order-linked billing records.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/70">
              {pagination.total} invoices found
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.5fr_minmax(0,220px)]">
            <Input
              placeholder="Search by invoice number, order number, customer, or email"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="bg-white/95"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl bg-white px-4 py-3 text-sm text-ink"
            >
              <option value="ALL">All invoices</option>
              <option value="GENERATED">Generated PDFs</option>
              <option value="PENDING">Not generated yet</option>
            </select>
          </div>

          <div className="space-y-4">
            {items.map((invoice) => (
              <div key={invoice.id} className="rounded-[28px] border border-white/10 bg-black/10 p-5 text-sm text-white/75">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-white">{invoice.invoiceNumber}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                          invoice.generatedAt ? "bg-emerald-500/15 text-emerald-200" : "bg-amber-500/15 text-amber-200"
                        }`}
                      >
                        {invoice.generatedAt ? "Generated" : "Pending"}
                      </span>
                    </div>
                    <p className="mt-2 text-white/60">
                      {invoice.order.orderNumber} · {invoice.order.user.name} · {invoice.order.user.email}
                    </p>
                    <p className="mt-2 text-white/50">
                      Created {formatDate(invoice.createdAt)} · Total {formatCurrency(Number(invoice.order.totalAmount))}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api$/, "")}/api/admin/orders/${invoice.orderId}/invoice`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/10"
                    >
                      Download PDF
                    </a>
                    <p className="text-xs text-white/45">
                      {invoice.lastDownloadedAt
                        ? `Last download ${formatDateTime(invoice.lastDownloadedAt)}`
                        : "No downloads yet"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="rounded-[22px] bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Billing</p>
                    <p className="mt-2 font-medium text-white">{invoice.billingName}</p>
                    <p className="mt-1 text-white/60">{invoice.billingEmail ?? "No billing email"}</p>
                    <p className="mt-1 text-white/60">{invoice.billingPhone ?? "No billing phone"}</p>
                  </div>
                  <div className="rounded-[22px] bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">GST / status</p>
                    <p className="mt-2 text-white/80">GSTIN: {invoice.gstin || "Not provided"}</p>
                    <p className="mt-1 text-white/60">Order: {invoice.order.status}</p>
                    <p className="mt-1 text-white/60">Payment: {invoice.order.paymentStatus}</p>
                  </div>
                  <div className="rounded-[22px] bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Persistence</p>
                    <p className="mt-2 text-white/80">
                      Generated: {invoice.generatedAt ? formatDateTime(invoice.generatedAt) : "Pending generation"}
                    </p>
                    <p className="mt-1 text-white/60">Downloads: {invoice.downloadCount}</p>
                  </div>
                </div>
              </div>
            ))}
            {!items.length ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center text-sm text-white/55">
                No invoices match the current search and status filters.
              </div>
            ) : null}
          </div>

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
