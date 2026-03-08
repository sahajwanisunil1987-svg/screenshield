"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Percent, Tags, TicketPercent } from "lucide-react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Coupon, PaginatedResponse } from "@/types";

const emptyForm = {
  code: "",
  description: "",
  value: "10",
  type: "PERCENTAGE",
  minOrderValue: "999",
  maxDiscount: "",
  usageLimit: "",
  expiresAt: "",
  isActive: true
};

export default function AdminCouponsPage() {
  const token = useAuthStore((state) => state.token);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PERCENTAGE" | "FLAT">("ALL");
  const [page, setPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const config = authHeaders(token);
      const response = await api.get<PaginatedResponse<Coupon>>("/admin/coupons", {
        ...config,
        params: {
          search: query || undefined,
          status: statusFilter,
          type: typeFilter,
          page,
          limit: 12
        }
      });
      setCoupons(response.data.items);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load coupons"));
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  useEffect(() => {
    if (!token) return;
    load();
  }, [page, query, statusFilter, token, typeFilter]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, typeFilter]);

  const pageNumbers = useMemo(
    () =>
      Array.from({ length: pagination.pages }, (_, index) => index + 1).filter((entry) =>
        entry === 1 || entry === pagination.pages || Math.abs(entry - pagination.page) <= 1
      ),
    [pagination.page, pagination.pages]
  );

  return (
    <AdminGuard>
      <AdminShell title="Coupons">
        <div className="space-y-6 rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white">Coupon controls</h3>
              <p className="mt-1 text-sm text-white/60">Create, edit, pause, and retire discount rules.</p>
            </div>
            {editingId ? (
              <Button variant="ghost" onClick={resetForm}>
                Cancel edit
              </Button>
            ) : null}
          </div>
          <div className="grid gap-3 lg:grid-cols-[1.5fr_repeat(2,minmax(0,220px))]">
            <Input placeholder="Search code or description" value={query} onChange={(event) => setQuery(event.target.value)} />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
              className="rounded-2xl bg-white px-4 py-3 text-sm text-ink"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active only</option>
              <option value="INACTIVE">Inactive only</option>
            </select>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as "ALL" | "PERCENTAGE" | "FLAT")}
              className="rounded-2xl bg-white px-4 py-3 text-sm text-ink"
            >
              <option value="ALL">All types</option>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FLAT">Flat</option>
            </select>
          </div>
          <p className="text-sm text-white/60">
            {pagination.total} coupons found · page {pagination.page} of {pagination.pages}
          </p>
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4 rounded-[28px] border border-white/10 bg-black/10 p-5">
              <div className="flex items-center gap-3">
                <TicketPercent className="h-5 w-5 text-cyan-200" />
                <div>
                  <p className="font-semibold text-white">{editingId ? "Edit coupon" : "Create coupon"}</p>
                  <p className="text-sm text-white/60">Configure the discount rule, limits, and expiry window.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input placeholder="Code" value={form.code} onChange={(event) => setForm((state) => ({ ...state, code: event.target.value.toUpperCase() }))} />
                <Input placeholder="Description" value={form.description} onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))} />
                <div className="relative">
                  <Percent className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
                  <Input
                    placeholder="Value"
                    value={form.value}
                    onChange={(event) => setForm((state) => ({ ...state, value: event.target.value }))}
                    className="pl-11"
                  />
                </div>
                <select
                  value={form.type}
                  onChange={(event) => setForm((state) => ({ ...state, type: event.target.value }))}
                  className="rounded-2xl bg-white px-4 py-3 text-sm text-ink"
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FLAT">Flat</option>
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  placeholder="Min order"
                  value={form.minOrderValue}
                  onChange={(event) => setForm((state) => ({ ...state, minOrderValue: event.target.value }))}
                />
                <Input
                  placeholder="Max discount"
                  value={form.maxDiscount}
                  onChange={(event) => setForm((state) => ({ ...state, maxDiscount: event.target.value }))}
                />
                <Input
                  placeholder="Usage limit"
                  value={form.usageLimit}
                  onChange={(event) => setForm((state) => ({ ...state, usageLimit: event.target.value }))}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <Input
                  placeholder="Expiry"
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(event) => setForm((state) => ({ ...state, expiresAt: event.target.value }))}
                />
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm((state) => ({ ...state, isActive: event.target.checked }))}
                  />
                  Active coupon
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  disabled={isSaving}
                  onClick={async () => {
                    try {
                      setIsSaving(true);
                      const config = authHeaders(token);
                      const payload = {
                        code: form.code,
                        description: form.description || undefined,
                        type: form.type,
                        value: Number(form.value),
                        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : undefined,
                        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
                        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
                        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
                        isActive: form.isActive
                      };

                      if (editingId) {
                        await api.put(`/admin/coupons/${editingId}`, payload, config);
                        toast.success("Coupon updated");
                      } else {
                        await api.post("/admin/coupons", payload, config);
                        toast.success("Coupon created");
                      }

                      resetForm();
                      load();
                    } catch (error) {
                      toast.error(getApiErrorMessage(error, "Unable to save coupon"));
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                >
                  {isSaving ? "Saving..." : editingId ? "Save changes" : "Add coupon"}
                </Button>
                {editingId ? (
                  <Button variant="ghost" onClick={resetForm}>
                    Discard edit
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="grid gap-4">
              <div className="rounded-[28px] border border-white/10 bg-black/10 p-5">
                <div className="flex items-center gap-3">
                  <Tags className="h-5 w-5 text-emerald-300" />
                  <div>
                    <p className="font-semibold text-white">Rule preview</p>
                    <p className="text-sm text-white/60">Quick read of the coupon you are editing.</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3 text-sm text-white/75">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">Code</p>
                    <p className="mt-2 font-semibold text-white">{form.code || "NEWCODE"}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">Discount</p>
                    <p className="mt-2 font-semibold text-white">
                      {form.type === "PERCENTAGE" ? `${form.value || "0"}% off` : `INR ${form.value || "0"} off`}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">Constraints</p>
                    <p className="mt-2">
                      Min order {form.minOrderValue || "none"} · Max discount {form.maxDiscount || "none"} · Usage {form.usageLimit || "unlimited"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-black/10 p-5">
                <div className="flex items-center gap-3">
                  <CalendarClock className="h-5 w-5 text-amber-300" />
                  <div>
                    <p className="font-semibold text-white">Expiry guidance</p>
                    <p className="text-sm text-white/60">Use a time-bound expiry for promotional campaigns and festive offers.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {!coupons.length ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center text-sm text-white/55">
              No coupons match the current search and filters.
            </div>
          ) : null}
          {coupons.map((coupon) => (
            <div key={coupon.id} className="space-y-3 rounded-[24px] border border-white/10 bg-black/10 p-5 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white">{coupon.code}</span>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${coupon.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                      {coupon.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-1 text-white/60">
                    {coupon.type} · Value {coupon.value}
                    {coupon.minOrderValue ? ` · Min order ${coupon.minOrderValue}` : ""}
                    {coupon.maxDiscount ? ` · Max ${coupon.maxDiscount}` : ""}
                  </p>
                  <p className="mt-1 text-white/40">
                    Used {coupon.usedCount}/{coupon.usageLimit ?? "unlimited"}
                    {coupon.expiresAt ? ` · Expires ${formatDateTime(coupon.expiresAt)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="text-cyan-300"
                    onClick={() => {
                      setEditingId(coupon.id);
                      setForm({
                        code: coupon.code,
                        description: coupon.description ?? "",
                        value: String(coupon.value),
                        type: coupon.type,
                        minOrderValue: coupon.minOrderValue ? String(coupon.minOrderValue) : "",
                        maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : "",
                        usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
                        expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : "",
                        isActive: Boolean(coupon.isActive)
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-400"
                    onClick={async () => {
                      try {
                        setDeletingId(coupon.id);
                        await api.delete(`/admin/coupons/${coupon.id}`, authHeaders(token));
                        toast.success("Coupon deleted");
                        if (editingId === coupon.id) {
                          resetForm();
                        }
                        load();
                      } catch (error) {
                        toast.error(getApiErrorMessage(error, "Unable to delete coupon"));
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                  >
                    {deletingId === coupon.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-white/5 p-4 text-white/70">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">Status</p>
                  <p className="mt-2 font-semibold text-white">{coupon.isActive ? "Ready to use" : "Paused"}</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4 text-white/70">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">Usage</p>
                  <p className="mt-2 font-semibold text-white">
                    {coupon.usageLimit ? `${coupon.usedCount}/${coupon.usageLimit}` : `${coupon.usedCount} redeemed`}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4 text-white/70">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">Expiry</p>
                  <p className="mt-2 font-semibold text-white">
                    {coupon.expiresAt ? formatDate(coupon.expiresAt) : "No expiry"}
                  </p>
                </div>
              </div>
            </div>
          ))}
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
