"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, CircleDotDashed, LifeBuoy, PackageSearch, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/utils";

const timeline = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const;

const statusDescriptions: Record<string, string> = {
  PENDING: "Your order is placed and waiting for processing confirmation.",
  CONFIRMED: "Order details are confirmed and the dispatch workflow has started.",
  PACKED: "The spare part has been packed and is being readied for shipment.",
  SHIPPED: "Your order is in transit and moving through the delivery network.",
  DELIVERED: "The order has been delivered successfully.",
  RETURNED: "The delivered order was returned and has moved into the return workflow.",
  CANCELLED: "This order was cancelled before completion."
};

const paymentDescriptions: Record<string, string> = {
  COD: "Cash on Delivery selected. Payment will be collected at delivery.",
  PENDING: "Payment is still awaiting confirmation.",
  PAID: "Payment has been confirmed successfully.",
  FAILED: "Payment attempt failed. Please contact support if the order needs help.",
  REFUNDED: "This order payment has been refunded."
};

const getPaymentLabel = (result: TrackResult) => {
  if (result.paymentStatus === "COD" && result.status === "DELIVERED") return "COD Reconciliation";
  if (result.paymentStatus === "PAID" && result.status === "DELIVERED") return "COD Collected";
  if (result.paymentStatus === "COD") return "COD Pending Collection";
  if (result.paymentStatus === "PENDING") return "Payment Pending";
  if (result.paymentStatus === "FAILED") return "Payment Failed";
  return result.paymentStatus;
};

const timelineLabels: Record<(typeof timeline)[number], string> = {
  PENDING: "Placed",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered"
};

type TimelineStep = {
  key: (typeof timeline)[number];
  label: string;
  description: string;
  reached: boolean;
  current: boolean;
  timestamp?: string | null;
};

type CancelledTimelineStep = {
  key: string;
  label: string;
  description: string;
  reached: boolean;
  current: boolean;
  timestamp?: string | null;
};

const buildTimeline = (result: TrackResult): (TimelineStep | CancelledTimelineStep)[] => {
  if (result.status === "CANCELLED") {
    return [
      {
        key: "PENDING",
        label: "Placed",
        description: statusDescriptions.PENDING,
        reached: true,
        current: false,
        timestamp: result.createdAt
      },
      {
        key: "CANCELLED",
        label: "Cancelled",
        description: statusDescriptions.CANCELLED,
        reached: true,
        current: true,
        timestamp: result.cancelRequestedAt ?? result.updatedAt
      }
    ];
  }

  if (result.returnRequestStatus === "APPROVED") {
    return [
      {
        key: "PENDING",
        label: "Placed",
        description: statusDescriptions.PENDING,
        reached: true,
        current: false,
        timestamp: result.createdAt
      },
      {
        key: "CONFIRMED",
        label: "Confirmed",
        description: statusDescriptions.CONFIRMED,
        reached: true,
        current: false,
        timestamp: result.confirmedAt ?? result.updatedAt
      },
      {
        key: "PACKED",
        label: "Packed",
        description: statusDescriptions.PACKED,
        reached: true,
        current: false,
        timestamp: result.packedAt ?? result.updatedAt
      },
      {
        key: "SHIPPED",
        label: "Shipped",
        description: statusDescriptions.SHIPPED,
        reached: true,
        current: false,
        timestamp: result.shippedAt ?? result.updatedAt
      },
      {
        key: "DELIVERED",
        label: "Delivered",
        description: statusDescriptions.DELIVERED,
        reached: true,
        current: false,
        timestamp: result.deliveredAt ?? result.updatedAt
      },
      {
        key: "RETURNED",
        label: "Returned",
        description: statusDescriptions.RETURNED,
        reached: true,
        current: true,
        timestamp: result.returnDecisionAt ?? result.updatedAt
      }
    ];
  }

  const statusIndex = timeline.indexOf(result.status as (typeof timeline)[number]);
  const shippedAt = result.status === "SHIPPED" || result.status === "DELIVERED" ? result.updatedAt : null;
  const deliveredAt = result.status === "DELIVERED" ? result.updatedAt : null;

  return timeline.map((step, index) => {
    let timestamp: string | null = null;

    if (step === "PENDING") {
      timestamp = result.createdAt;
    } else if (step === "SHIPPED") {
      timestamp = shippedAt;
    } else if (step === "DELIVERED") {
      timestamp = deliveredAt;
    } else if (index <= statusIndex) {
      timestamp = result.updatedAt;
    }

    return {
      key: step,
      label: timelineLabels[step],
      description: statusDescriptions[step],
      reached: statusIndex >= index,
      current: result.status === step,
      timestamp
    };
  });
};

type TrackResult = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string | null;
  packedAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  shippingCourier?: string | null;
  shippingAwb?: string | null;
  estimatedDeliveryAt?: string | null;
  cancelRequestedAt?: string | null;
  cancelRequestStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
  returnRequestedAt?: string | null;
  returnRequestStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
  returnDecisionAt?: string | null;
};

export function TrackOrderPageClient() {
  const [orderNumber, setOrderNumber] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const timelineIndex = result ? timeline.indexOf(result.status as (typeof timeline)[number]) : -1;
  const shipmentTimeline = result ? buildTimeline(result) : [];

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
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="theme-surface rounded-[36px] p-8 shadow-card">
          <h1 className="font-display text-4xl text-ink">Track your order</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate">Enter your SpareKart order number to check the latest processing stage, shipment fields, and payment state.</p>
          <div className="mt-6 grid gap-3 rounded-[28px] bg-panel p-4 text-sm text-slate md:grid-cols-3">
            <div className="theme-surface rounded-2xl p-4"><PackageSearch className="h-5 w-5 text-accent" /><p className="mt-3 font-semibold text-ink">Order visibility</p><p className="mt-1 text-slate">Track order progression from placement to final delivery.</p></div>
            <div className="theme-surface rounded-2xl p-4"><Truck className="h-5 w-5 text-accent" /><p className="mt-3 font-semibold text-ink">Dispatch clarity</p><p className="mt-1 text-slate">See courier, AWB, and ETA as soon as the ops team updates them.</p></div>
            <div className="theme-surface rounded-2xl p-4"><ShieldCheck className="h-5 w-5 text-accent" /><p className="mt-3 font-semibold text-ink">Payment context</p><p className="mt-1 text-slate">Check whether COD or online payment is already confirmed.</p></div>
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
                  <span className="rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate">{getPaymentLabel(result)}</span>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="theme-surface rounded-2xl p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Placed on</p><p className="mt-2 font-semibold text-ink">{formatDate(result.createdAt)}</p><p className="mt-1 text-xs text-slate">{formatDateTime(result.createdAt)}</p></div>
                <div className="theme-surface rounded-2xl p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Courier</p><p className="mt-2 font-semibold text-ink">{result.shippingCourier ?? "Pending"}</p></div>
                <div className="theme-surface rounded-2xl p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">AWB</p><p className="mt-2 font-semibold text-ink">{result.shippingAwb ?? "Pending"}</p></div>
                <div className="theme-surface rounded-2xl p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">ETA</p><p className="mt-2 font-semibold text-ink">{result.estimatedDeliveryAt ? formatDate(result.estimatedDeliveryAt) : "Pending"}</p></div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="theme-surface rounded-2xl p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Current status</p><p className="mt-2 font-semibold text-ink">{statusDescriptions[result.status] ?? "Order status updated."}</p></div>
                <div className="theme-surface rounded-2xl p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Payment note</p><p className="mt-2 font-semibold text-ink">{paymentDescriptions[result.paymentStatus] ?? "Payment status updated."}</p></div>
              </div>
              {result.cancelRequestStatus ? <div className="mt-4 rounded-2xl bg-amber-500/15 p-4 text-amber-300"><p className="text-xs font-semibold uppercase tracking-[0.18em]">Cancellation request</p><p className="mt-2 text-sm">Status: {result.cancelRequestStatus}</p></div> : null}
              {result.returnRequestStatus ? <div className="mt-4 rounded-2xl bg-sky-500/15 p-4 text-sky-300"><p className="text-xs font-semibold uppercase tracking-[0.18em]">Return request</p><p className="mt-2 text-sm">Status: {result.returnRequestStatus}</p></div> : null}
              <div className="theme-surface mt-6 rounded-[24px] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Shipment timeline</p>
                    <p className="mt-2 text-sm text-slate">
                      {result.status === "CANCELLED"
                        ? "This order reached a terminal cancelled state before fulfilment was completed."
                        : result.returnRequestStatus === "APPROVED"
                          ? "This order completed delivery and later moved through the return workflow."
                          : "Milestones become active as the operations team moves the order through fulfilment."}
                    </p>
                  </div>
                  {result.status === "CANCELLED" ? (
                    <span className="rounded-full bg-amber-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Cancelled</span>
                  ) : result.returnRequestStatus === "APPROVED" ? (
                    <span className="rounded-full bg-sky-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">Returned</span>
                  ) : null}
                </div>
                <div className="mt-5 grid gap-3 lg:grid-cols-5">
                  {shipmentTimeline.map((step, index) => (
                    <div
                      key={step.key}
                      className={`relative min-w-0 rounded-[24px] border p-4 ${
                        step.current
                          ? "border-accent/30 bg-accentSoft"
                          : step.reached
                            ? "border-emerald-400/20 bg-emerald-500/12"
                            : "border-slate-200 bg-panel"
                      }`}
                    >
                      {index < shipmentTimeline.length - 1 ? (
                        <div className="absolute -right-2 top-8 hidden h-px w-4 bg-slate-300 lg:block" />
                      ) : null}
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 rounded-full p-2 ${step.current ? "bg-accent text-white" : step.reached ? "bg-emerald-500 text-white" : "bg-white/90 text-slate-400"}`}>
                          {step.reached ? <CheckCircle2 className="h-4 w-4" /> : <CircleDotDashed className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">{step.label}</p>
                          <p className="mt-2 text-sm font-medium text-ink">{step.description}</p>
                          <p className="mt-3 text-xs text-slate">
                            {step.timestamp ? formatDateTime(step.timestamp) : step.reached ? "Updated" : "Pending"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="theme-surface mt-6 rounded-[24px] border border-slate-200/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Recommended next step</p>
                <p className="mt-2 text-sm font-semibold text-ink">
                  {result.status === "CANCELLED"
                    ? "This order has been cancelled. Contact support if you need help with a replacement or a new order."
                    : result.returnRequestStatus === "APPROVED"
                      ? "This order has been returned. Contact support if you need help with refund or replacement updates."
                      : timelineIndex <= 0
                        ? "Give the operations team a little time to confirm and queue the order."
                        : timelineIndex <= 2
                          ? "Your order is progressing normally. Check again after the next dispatch update."
                          : timelineIndex === 3
                            ? "The order is on the way. Keep the order number ready for delivery-related support."
                            : "Order delivered. If anything looks wrong, contact support with your order number."}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/support"><Button variant="secondary"><LifeBuoy className="mr-2 h-4 w-4" />Contact support</Button></Link>
                  <Link href="/my-orders"><Button variant="ghost" className="border border-slate-200 bg-white/90 text-ink hover:bg-accentSoft">View my orders</Button></Link>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
  );
}
