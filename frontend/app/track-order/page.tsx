"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, getApiErrorMessage } from "@/lib/api";

const timeline = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"];

type TrackResult = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const preset = new URLSearchParams(window.location.search).get("orderNumber");
    if (preset) {
      setOrderNumber(preset);
      void (async () => {
        try {
          setIsLoading(true);
          const response = await api.get(`/orders/track/${preset}`);
          setResult(response.data);
        } catch (error) {
          setResult(null);
          toast.error(getApiErrorMessage(error, "Unable to track order"));
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, []);

  const onTrack = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/orders/track/${orderNumber}`);
      setResult(response.data);
    } catch (error) {
      setResult(null);
      toast.error(getApiErrorMessage(error, "Unable to track order"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[36px] bg-white p-8 shadow-card">
          <h1 className="font-display text-4xl text-ink">Track your order</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate">
            Enter your SpareKart order number to check the latest processing stage and payment state.
          </p>
          <div className="mt-8 flex gap-3">
            <Input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="Enter order number" />
            <Button onClick={onTrack} disabled={!orderNumber.trim() || isLoading}>
              {isLoading ? "Tracking..." : "Track"}
            </Button>
          </div>
          {result ? (
            <div className="mt-8 rounded-[28px] bg-[#f5f8fb] p-6 text-sm text-slate">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Order number</p>
                  <p className="mt-2 font-semibold text-ink">{result.orderNumber}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                    {result.status}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate">
                    {result.paymentStatus}
                  </span>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Placed on</p>
                  <p className="mt-2 font-semibold text-ink">
                    {new Date(result.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Last updated</p>
                  <p className="mt-2 font-semibold text-ink">
                    {new Date(result.updatedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-5">
                {timeline.map((step) => {
                  const reached = timeline.indexOf(result.status) >= timeline.indexOf(step);

                  return (
                    <div
                      key={step}
                      className={`rounded-2xl px-3 py-4 text-center text-xs font-semibold uppercase tracking-[0.16em] ${
                        reached ? "bg-accent text-white" : "bg-white text-slate"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        {reached ? <CheckCircle2 className="h-4 w-4" /> : <ArrowRight className="h-4 w-4 opacity-40" />}
                        <span>{step}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
