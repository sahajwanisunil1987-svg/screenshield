"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, getApiErrorMessage } from "@/lib/api";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [result, setResult] = useState<Record<string, string> | null>(null);

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
            </div>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
