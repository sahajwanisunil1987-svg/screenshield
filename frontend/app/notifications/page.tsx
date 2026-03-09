"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { api, authHeaders, getApiErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { Notification } from "@/types";
import { useAuthStore } from "@/store/auth-store";

type NotificationResponse = {
  items: Notification[];
  unreadCount: number;
};

export default function NotificationsPage() {
  useAuthGuard("CUSTOMER");
  const token = useAuthStore((state) => state.token);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = () => {
    if (!token) return;
    api
      .get<NotificationResponse>("/account/notifications", authHeaders(token))
      .then((response) => {
        setItems(response.data.items);
        setUnreadCount(response.data.unreadCount);
      })
      .catch((error) => toast.error(getApiErrorMessage(error, "Unable to load notifications")));
  };

  useEffect(() => {
    load();
  }, [token]);

  const markRead = async (id: string) => {
    if (!token) return;

    try {
      await api.post(`/account/notifications/${id}/read`, {}, authHeaders(token));
      setItems((current) => current.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
      setUnreadCount((current) => Math.max(current - 1, 0));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update notification"));
    }
  };

  const markAll = async () => {
    if (!token) return;
    try {
      await api.post("/account/notifications/read-all", {}, authHeaders(token));
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update notifications"));
    }
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate">Notification center</p>
            <h1 className="mt-3 font-display text-4xl text-ink">Order updates</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate">Track every important account and order event from one place.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/account" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white">Account</Link>
            <Button type="button" variant="secondary" onClick={markAll}>Mark all read</Button>
          </div>
        </div>
        <div className="mt-8 rounded-[28px] border border-slate-200 bg-panel p-5 text-sm text-slate">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-accent" />
            <span>{unreadCount} unread notification(s)</span>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {items.length ? items.map((item) => (
            <div key={item.id} className={`rounded-[28px] bg-white p-5 shadow-card ${item.isRead ? "opacity-80" : "ring-2 ring-accent/15"}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-ink">{item.title}</p>
                  <p className="mt-2 text-sm text-slate">{item.message}</p>
                  <p className="mt-3 text-xs text-slate">{formatDateTime(item.createdAt)}</p>
                </div>
                <div className="flex gap-3">
                  {item.href ? <Link href={item.href} onClick={() => { if (!item.isRead) void markRead(item.id); }} className="text-sm font-semibold text-accent underline">Open</Link> : null}
                  {!item.isRead ? <button type="button" onClick={() => markRead(item.id)} className="text-sm font-semibold text-slate underline">Mark read</button> : null}
                </div>
              </div>
            </div>
          )) : <EmptyState title="No notifications yet" description="Your order and account updates will appear here." />}
        </div>
      </div>
    </PageShell>
  );
}
