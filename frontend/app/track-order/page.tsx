"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, LifeBuoy, PackageSearch, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/utils";

const timeline = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"];

const statusDescriptions: Record<string, string> = {
  PENDING: "Your order is placed and waiting for processing confirmation.",
  CONFIRMED: "Order details are confirmed and the dispatch workflow has started.",
  PACKED: "The spare part has been packed and is being readied for shipment.",
  SHIPPED: "Your order is in transit and moving through the delivery network.",
  DELIVERED: "The order has been delivered successfully.",
  CANCELLED: "This order was cancelled before completion."
};

const paymentDescriptions: Record<string, string> = {
  COD: "Cash on Delivery selected. Payment will be collected at delivery.",
  PENDING: "Payment is still awaiting confirmation.",
  PAID: "Payment has been confirmed successfully.",
  FAILED: "Payment attempt failed. Please contact support if the order needs help.",
  REFUNDED: "This order payment has been refunded."
};

type TrackResult = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  shippingCourier?: string | null;
  shippingAwb?: string | null;
  estimatedDeliveryAt?: string | null;
  adminNotes?: string | null;
  cancelRequestedAt?: string | null;
  cancelRequestReason?: string | null;
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const timelineIndex = result ? timeline.indexOf(result.status) : -1;

  useEffect(() => {
    const preset = new URLSearchParams(window.location.search).get("orderNumber");
    if (preset) {
      setOrderNumber(preset);
      void onTrack(preset);
    }
  }, []);

  const onTrack = async (value = orderNumber) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/orders/track/${value}`);
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
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[36px] bg-white p-8 shadow-card">
          <h1 className="font-display text-4xl text-ink">Track your order</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate">Enter your SpareKart order number to check the latest processing stage, shipment fields, and payment state.</p>
          <div className="mt-6 grid gap-3 rounded-[28px] bg-panel p-4 text-sm text-slate md:grid-cols-3">
            <div className="rounded-2xl bg-white/80 p-4"><PackageSearch className="h-5 w-5 text-accent" /><p className="mt-3 font-semibold text-ink">Order visibility</p><p className="mt-1 text-slate">Track order progression from placement to final delivery.</p></div>
            <div className="rounded-2xl bg-white/80 p-4"><Truck className="h-5 w-5 text-accent" /><p className="mt-3 font-semibold text-ink">Dispatch clarity</p><p className="mt-1 text-slate">See courier, AWB, and ETA as soon as the ops team updates them.</p></div>
            <div className="rounded-2xl bg-white/80 p-4"><ShieldCheck className="h-5 w-5 text-accent" /><p className="mt-3 font-semibold text-ink">Payment context</p><p className="mt-1 text-slate">Check whether COD or online payment is already confirmed.</p></div>
          </div>
          <div className="mt-8 flex gap-3">
            <Input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="Enter order number" />
            <Button disabled={isLoading || !orderNumber.trim()} onClick={() => onTrack()}>{isLoading ? "Checking..." : "Track"}</Button>
          </div>

          {result ? (
            <div className="mt-8 rounded-[28px] bg-panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Order number</p>
                  <h2 className="mt-2 font-display text-3xl text-ink">{result.orderNumber}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white">{result.status}</span>
                  <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate">{result.paymentStatus}</span>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Placed on</p><p className="mt-2 font-semibold text-ink">{formatDate(result.createdAt)}</p><p className="mt-1 text-xs text-slate">{formatDateTime(result.createdAt)}</p></div>
                <div className="rounded-2xl bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Courier</p><p className="mt-2 font-semibold text-ink">{result.shippingCourier ?? "Pending"}</p></div>
                <div className="rounded-2xl bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">AWB</p><p className="mt-2 font-semibold text-ink">{result.shippingAwb ?? "Pending"}</p></div>
                <div className="rounded-2xl bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">ETA</p><p className="mt-2 font-semibold text-ink">{result.estimatedDeliveryAt ? formatDate(result.estimatedDeliveryAt) : "Pending"}</p></div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Current status</p><p className="mt-2 font-semibold text-ink">{statusDescriptions[result.status] ?? "Order status updated."}</p></div>
                <div className="rounded-2xl bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Payment note</p><p className="mt-2 font-semibold text-ink">{paymentDescriptions[result.paymentStatus] ?? "Payment status updated."}</p></div>
              </div>
              {result.adminNotes ? <div className="mt-4 rounded-2xl bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Operations note</p><p className="mt-2 font-semibold text-ink">{result.adminNotes}</p></div> : null}
              {result.cancelRequestReason ? <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-amber-800"><p className="text-xs font-semibold uppercase tracking-[0.18em]">Cancellation request</p><p className="mt-2">{result.cancelRequestReason}</p></div> : null}
              <div className="mt-6 grid gap-3 md:grid-cols-5">
                {timeline.map((step) => {
                  const reached = timeline.indexOf(result.status) >= timeline.indexOf(step);

                  return (
                    <div key={step} className={`rounded-2xl px-3 py-4 text-center text-xs font-semibold uppercase tracking-[0.16em] ${reached ? "bg-accent text-white" : "bg-white text-slate"}`}>
                      <div className="flex flex-col items-center gap-2">
                        {reached ? <CheckCircle2 className="h-4 w-4" /> : <ArrowRight className="h-4 w-4 opacity-40" />}
                        <span>{step === "PENDING" ? "Placed" : step === "CONFIRMED" ? "Confirmed" : step === "PACKED" ? "Packed" : step === "SHIPPED" ? "Shipped" : "Delivered"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 rounded-[24px] border border-white/60 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Recommended next step</p>
                <p className="mt-2 text-sm font-semibold text-ink">
                  {timelineIndex <= 0
                    ? "Give the operations team a little time to confirm and queue the order."
                    : timelineIndex <= 2
                      ? "Your order is progressing normally. Check again after the next dispatch update."
                      : timelineIndex === 3
                        ? "The order is on the way. Keep the order number ready for delivery-related support."
                        : "Order delivered. If anything looks wrong, contact support with your order number."}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/support"><Button variant="secondary"><LifeBuoy className="mr-2 h-4 w-4" />Contact support</Button></Link>
                  <Link href="/my-orders"><Button variant="ghost" className="border border-slate-200 bg-white text-ink hover:bg-accentSoft">View my orders</Button></Link>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
