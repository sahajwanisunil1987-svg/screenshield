"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Review } from "@/types";
import { Button } from "../ui/button";

const stars = [1, 2, 3, 4, 5];

export function ReviewPanel({
  productId,
  initialReviews,
  averageRating,
  reviewCount
}: {
  productId: string;
  initialReviews: Review[];
  averageRating: number;
  reviewCount: number;
}) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const summary = useMemo(() => {
    if (reviews.length === 0) {
      return { average: averageRating, count: reviewCount };
    }

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return { average: total / reviews.length, count: reviews.length };
  }, [averageRating, reviewCount, reviews]);

  return (
    <section className="mt-14 grid gap-8 lg:grid-cols-[0.88fr_1.12fr]">
      <div className="rounded-[32px] bg-white p-8 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Ratings snapshot</p>
        <div className="mt-4 flex items-end gap-4">
          <span className="font-display text-6xl text-ink">{summary.average.toFixed(1)}</span>
          <div className="pb-2 text-sm text-slate">
            <p>{"★".repeat(Math.round(summary.average || 0)).padEnd(5, "☆")}</p>
            <p className="mt-1">{summary.count} verified review(s)</p>
          </div>
        </div>
        <div className="mt-6 space-y-3 text-sm text-slate">
          <p>Only signed-in customers can post or update a review.</p>
          <p>Your review helps technicians and buyers choose the right spare part faster.</p>
        </div>

        {user ? (
          <form
            className="mt-8 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setIsSubmitting(true);

              try {
                const response = await api.post(
                  `/products/${productId}/reviews`,
                  { rating, title: title.trim() || undefined, comment },
                  authHeaders(token)
                );

                const nextReview = {
                  ...response.data,
                  user: { name: user.name },
                  createdAt: response.data.createdAt ?? new Date().toISOString()
                } as Review;

                setReviews((current) => {
                  const remaining = current.filter((item) => item.id !== nextReview.id);
                  return [nextReview, ...remaining];
                });
                setTitle("");
                setComment("");
                setRating(5);
                toast.success("Review saved");
              } catch (error) {
                toast.error(getApiErrorMessage(error, "Unable to save review"));
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            <div>
              <p className="text-sm font-semibold text-ink">Your rating</p>
              <div className="mt-3 flex gap-2">
                {stars.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                      value <= rating ? "bg-accent text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {value}★
                  </button>
                ))}
              </div>
            </div>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Short title (optional)"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
            />
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Share fit quality, packaging, and delivery experience"
              className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
            />
            <Button disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Submit review"}</Button>
          </form>
        ) : (
          <div className="mt-8 rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate">
            Login required to submit a review.
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {reviews.length ? (
          reviews.map((review) => (
            <div key={review.id} className="rounded-[28px] bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{review.user.name}</p>
                  {review.title ? <p className="mt-1 text-sm font-medium text-ink/80">{review.title}</p> : null}
                </div>
                <div className="text-right text-sm text-accent">
                  <p>{review.rating}/5</p>
                  <p className="mt-1 text-slate">{new Date(review.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate">{review.comment}</p>
            </div>
          ))
        ) : (
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-8 text-sm text-slate shadow-card">
            No reviews yet. Be the first buyer to share fitment feedback.
          </div>
        )}
      </div>
    </section>
  );
}
