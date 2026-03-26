"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { PaginatedResponse, SupportTicket } from "@/types";

export function AdminSupportPageClient() {
  const token = useAuthStore((state) => state.token);
  const [items, setItems] = useState<SupportTicket[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [kindFilter, setKindFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = () => {
    if (!token) return;
    api
      .get<PaginatedResponse<SupportTicket>>("/admin/support-tickets", {
        ...authHeaders(token),
        params: { search: query || undefined, status: statusFilter, kind: kindFilter, page, limit: 12 }
      })
      .then((response) => {
        setItems(response.data.items);
        setPagination(response.data.pagination);
        setNotes((current) => {
          const next = { ...current };
          for (const ticket of response.data.items) {
            next[ticket.id] = next[ticket.id] ?? ticket.adminNotes ?? "";
          }
          return next;
        });
      })
      .catch((error) => toast.error(getApiErrorMessage(error, "Unable to load support inbox")));
  };

  useEffect(() => { load(); }, [kindFilter, page, query, statusFilter, token]);
  useEffect(() => { setPage(1); }, [kindFilter, query, statusFilter]);

  const summary = useMemo(() => ({
    newItems: items.filter((ticket) => ticket.status === "NEW").length,
    inProgress: items.filter((ticket) => ticket.status === "IN_PROGRESS").length,
    resolved: items.filter((ticket) => ticket.status === "RESOLVED").length
  }), [items]);

  const updateTicket = async (ticket: SupportTicket, status: SupportTicket["status"]) => {
    try {
      const response = await api.patch<SupportTicket>(`/admin/support-tickets/${ticket.id}`, {
        status,
        adminNotes: notes[ticket.id] || undefined
      }, authHeaders(token));
      setItems((current) => current.map((entry) => (entry.id === ticket.id ? response.data : entry)));
      toast.success("Support ticket updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update support ticket"));
    }
  };

  return (
    <AdminGuard>
      <AdminShell title="Support inbox">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[28px] border border-amber-400/20 bg-amber-500/10 p-5 text-white"><p className="text-sm text-white/65">New</p><p className="mt-3 font-display text-4xl text-amber-100">{summary.newItems}</p></div>
          <div className="rounded-[28px] border border-cyan-400/20 bg-cyan-500/10 p-5 text-white"><p className="text-sm text-white/65">In progress</p><p className="mt-3 font-display text-4xl text-cyan-100">{summary.inProgress}</p></div>
          <div className="rounded-[28px] border border-emerald-400/20 bg-emerald-500/10 p-5 text-white"><p className="text-sm text-white/65">Resolved</p><p className="mt-3 font-display text-4xl text-emerald-100">{summary.resolved}</p></div>
        </div>

        <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="grid gap-3 lg:grid-cols-[1.5fr_repeat(2,minmax(0,220px))]">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by customer, email, phone, subject, or order number" className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink">
              <option value="ALL">All statuses</option>
              <option value="NEW">New</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
            <select value={kindFilter} onChange={(event) => setKindFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-ink">
              <option value="ALL">All issue types</option>
              <option value="ORDER_ISSUE">Order issue</option>
              <option value="RETURN_ISSUE">Return issue</option>
              <option value="PAYMENT_ISSUE">Payment issue</option>
              <option value="PRODUCT_INQUIRY">Product inquiry</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-6">
          {items.map((ticket) => (
            <div key={ticket.id} className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-5 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">{ticket.subject}</p>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/75">{ticket.kind.replaceAll("_", " ")}</span>
                    <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-cyan-200">{ticket.status}</span>
                  </div>
                  <p className="mt-2 text-white/60">{ticket.name} · {ticket.email}{ticket.phone ? ` · ${ticket.phone}` : ""}</p>
                  <p className="mt-1 text-xs text-white/45">Raised {formatDate(ticket.createdAt)}{ticket.orderNumber ? ` · Order ${ticket.orderNumber}` : ""}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-black/10 p-4 text-white/80">{ticket.message}</div>
              <textarea value={notes[ticket.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [ticket.id]: event.target.value }))} placeholder="Admin notes" className="min-h-[110px] w-full rounded-2xl bg-white px-4 py-3 text-sm text-ink" />
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => updateTicket(ticket, "IN_PROGRESS")} className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-400">Mark in progress</button>
                <button type="button" onClick={() => updateTicket(ticket, "RESOLVED")} className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400">Mark resolved</button>
                <button type="button" onClick={() => updateTicket(ticket, "NEW")} className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Reopen</button>
              </div>
            </div>
          ))}
          {!items.length ? <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center text-sm text-white/55">No support tickets match the current filters.</div> : null}
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
