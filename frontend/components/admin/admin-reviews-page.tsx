"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EyeOff, ShieldCheck, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { Input } from "@/components/ui/input";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { AdminReview, PaginatedResponse } from "@/types";

const stars = [1, 2, 3, 4, 5];

export function AdminReviewsPageClient() {
  const token = useAuthStore((state) => state.token);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [query, setQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [busyReviewId, setBusyReviewId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const config = authHeaders(token);
    api
      .get<PaginatedResponse<AdminReview>>("/admin/reviews", {
        ...config,
        params: {
          search: query || undefined,
          rating: ratingFilter,
          status: statusFilter,
          page,
          limit: 12
        }
      })
      .then((response) => {
        setReviews(response.data.items);
        setPagination(response.data.pagination);
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load reviews"));
      });
  }, [page, query, ratingFilter, statusFilter, token]);

  useEffect(() => {
    setPage(1);
  }, [query, ratingFilter, statusFilter]);

  const pageNumbers = useMemo(
    () =>
      Array.from({ length: pagination.pages }, (_, index) => index + 1).filter((entry) =>
        entry === 1 || entry === pagination.pages || Math.abs(entry - pagination.page) <= 1
      ),
    [pagination.page, pagination.pages]
  );

  return (
    <AdminGuard>
      <AdminShell title="Reviews">
        <div className="space-y-6 rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white">Review moderation</h3>
              <p className="mt-1 text-sm text-white/60">
                Inspect buyer feedback, approve public reviews, or hide/remove problematic entries.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/70">
              {pagination.total} reviews found
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.4fr_minmax(0,220px)_minmax(0,220px)]">
            <Input
              placeholder="Search by product, SKU, customer, or review text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="bg-white/95"
            />
            <select
              value={ratingFilter}
              onChange={(event) => setRatingFilter(event.target.value)}
              className="rounded-2xl bg-white px-4 py-3 text-sm text-ink"
            >
              <option value="ALL">All ratings</option>
              {stars.map((rating) => (
                <option key={rating} value={String(rating)}>
                  {rating} star
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl bg-white px-4 py-3 text-sm text-ink"
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="HIDDEN">Hidden</option>
            </select>
          </div>

          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-[28px] border border-white/10 bg-black/10 p-5 text-sm text-white/75">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-white">{review.product.name}</p>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">
                        SKU {review.product.sku}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                          review.status === "APPROVED"
                            ? "bg-emerald-500/15 text-emerald-200"
                            : review.status === "HIDDEN"
                              ? "bg-rose-500/15 text-rose-200"
                              : "bg-amber-500/15 text-amber-200"
                        }`}
                      >
                        {review.status}
                      </span>
                    </div>
                    <p className="text-white/60">
                      {review.user.name} · {review.user.email}
                    </p>
                    <div className="flex items-center gap-1 text-amber-400">
                      {stars.map((value) => (
                        <Star key={value} className={`h-4 w-4 ${value <= review.rating ? "fill-current" : ""}`} />
                      ))}
                    </div>
                  </div>
                  <div className="text-right text-xs text-white/45">
                    <p>{formatDate(review.createdAt)}</p>
                    <Link href={`/products/${review.product.slug}`} className="mt-2 inline-block font-semibold text-cyan-200 underline">
                      Open product
                    </Link>
                  </div>
                </div>
                {review.title ? <p className="mt-4 font-semibold text-white">{review.title}</p> : null}
                <div className="mt-4 rounded-[22px] bg-white/5 p-4">
                  <p className="leading-7">{review.comment}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={busyReviewId === review.id || review.status === "APPROVED"}
                    onClick={async () => {
                      if (!token) return;
                      setBusyReviewId(review.id);
                      try {
                        const response = await api.patch<AdminReview>(
                          `/admin/reviews/${review.id}/status`,
                          { status: "APPROVED" },
                          authHeaders(token)
                        );
                        setReviews((current) => current.map((item) => (item.id === review.id ? response.data : item)));
                        toast.success("Review approved");
                      } catch (error) {
                        toast.error(getApiErrorMessage(error, "Unable to approve review"));
                      } finally {
                        setBusyReviewId(null);
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyReviewId === review.id || review.status === "HIDDEN"}
                    onClick={async () => {
                      if (!token) return;
                      setBusyReviewId(review.id);
                      try {
                        const response = await api.patch<AdminReview>(
                          `/admin/reviews/${review.id}/status`,
                          { status: "HIDDEN" },
                          authHeaders(token)
                        );
                        setReviews((current) => current.map((item) => (item.id === review.id ? response.data : item)));
                        toast.success("Review hidden");
                      } catch (error) {
                        toast.error(getApiErrorMessage(error, "Unable to hide review"));
                      } finally {
                        setBusyReviewId(null);
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-200 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <EyeOff className="h-4 w-4" />
                    Hide
                  </button>
                  <button
                    type="button"
                    disabled={busyReviewId === review.id}
                    onClick={async () => {
                      if (!token) return;
                      const confirmed = window.confirm(
                        `Delete this review for "${review.product.name}"? This action cannot be undone.`
                      );
                      if (!confirmed) {
                        return;
                      }
                      setBusyReviewId(review.id);
                      try {
                        await api.delete(`/admin/reviews/${review.id}`, authHeaders(token));
                        setReviews((current) => current.filter((item) => item.id !== review.id));
                        setPagination((current) => ({
                          ...current,
                          total: Math.max(current.total - 1, 0)
                        }));
                        toast.success("Review deleted");
                      } catch (error) {
                        toast.error(getApiErrorMessage(error, "Unable to delete review"));
                      } finally {
                        setBusyReviewId(null);
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-rose-200 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {!reviews.length ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center text-sm text-white/55">
                No reviews match the current search, rating, and moderation filters.
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
