"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, getApiErrorMessage } from "@/lib/api";

const timeline = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"];

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [result, setResult] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    const preset = new URLSearchParams(window.location.search).get("orderNumber");
    if (preset) {
      setOrderNumber(preset);
    }
  }, []);

  const onTrack = async () => {
    try {
      const response = await api.get(`/orders/track/${orderNumber}`);
      setResult(response.data);
    } catch (error) {
      setResult(null);
      toast.error(getApiErrorMessage(error, "Unable to track order"));
    }
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[36px] bg-white p-8 shadow-card">
          <h1 className="font-display text-4xl text-ink">Track your order</h1>
          <div className="mt-8 flex gap-3">
            <Input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="Enter order number" />
            <Button onClick={onTrack}>Track</Button>
          </div>
          {result ? (
            <div className="mt-8 rounded-[28px] bg-[#f5f8fb] p-6 text-sm text-slate">
              <p>Status: <span className="font-semibold text-ink">{result.status}</span></p>
              <p className="mt-2">Payment: <span className="font-semibold text-ink">{result.paymentStatus}</span></p>
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
                      {step}
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
