"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Copy, Download, LifeBuoy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Order } from "@/types";

export function OrderSuccessActions({ orderNumber }: { orderNumber?: string }) {
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!orderNumber || !token) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        setIsLoading(true);
        const response = await api.get<Order[]>("/orders/my-orders", authHeaders(token));
        if (cancelled) {
          return;
        }

        const matchedOrder = response.data.find((entry) => entry.orderNumber === orderNumber) ?? null;
        setOrder(matchedOrder);
      } catch (error) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(error, "Unable to load order actions"));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderNumber, token]);

  const downloadInvoice = async () => {
    if (!token || !order) return;

    setIsDownloading(true);
    try {
      const response = await api.get(`/orders/${order.id}/invoice`, {
        ...authHeaders(token),
        responseType: "blob"
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `invoice-${order.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to download invoice"));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      <Link href="/products">
        <Button>Continue shopping</Button>
      </Link>
      <Link href="/my-orders">
        <Button variant="secondary">View orders</Button>
      </Link>
      {orderNumber ? (
        <Link href={`/track-order?orderNumber=${orderNumber}`}>
          <Button variant="ghost" className="border border-slate-200 bg-white text-ink hover:bg-accentSoft">
            Track order
          </Button>
        </Link>
      ) : null}
      {hasHydrated && order?.invoice?.invoiceNumber ? (
        <Button
          type="button"
          variant="ghost"
          disabled={isDownloading}
          onClick={downloadInvoice}
          className="border border-slate-200 bg-white text-ink hover:bg-accentSoft"
        >
          <Download className="mr-2 h-4 w-4" />
          {isDownloading ? "Downloading..." : "Download invoice"}
        </Button>
      ) : null}
      {orderNumber ? (
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(orderNumber);
            toast.success("Order number copied");
          }}
        >
          <Button type="button" variant="ghost" className="border border-slate-200 bg-white text-ink hover:bg-accentSoft">
            <Copy className="mr-2 h-4 w-4" />
            Copy order number
          </Button>
        </button>
      ) : null}
      <Link href="/support">
        <Button variant="ghost" className="border border-slate-200 bg-white text-ink hover:bg-accentSoft">
          <LifeBuoy className="mr-2 h-4 w-4" />
          Get support
        </Button>
      </Link>
      {isLoading ? (
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading order actions
        </div>
      ) : null}
    </div>
  );
}
